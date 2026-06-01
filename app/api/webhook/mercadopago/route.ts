import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'
import { getPaymentById } from '@/lib/mercadopago'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  console.log('📨 Webhook MercadoPago recibido')
  
  try {
    const body = await request.json()
    console.log('📦 Body:', JSON.stringify(body, null, 2))

    // MercadoPago envía notificaciones de tipo "payment"
    if (body.type === 'payment') {
      const paymentId = body.data?.id

      if (!paymentId) {
        console.error('❌ No payment ID en webhook')
        return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
      }

      console.log(`🔍 Obteniendo detalles de pago: ${paymentId}`)

      // Obtener detalles del pago desde MercadoPago
      let payment
      try {
        payment = await getPaymentById(paymentId.toString())
      } catch (mpError: any) {
        console.error('❌ Error obteniendo pago de MercadoPago:', mpError.message)
        return NextResponse.json(
          { error: 'Could not fetch payment from MercadoPago' },
          { status: 502 }
        )
      }

      if (!payment || !payment.id) {
        console.error('❌ Payment no encontrado en MercadoPago')
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      console.log(`💰 Pago encontrado: ${payment.id} - Monto: ${payment.transaction_amount}`)

      const movimientoData = {
        mercadopago_id: payment.id.toString(),
        monto: payment.transaction_amount || 0,
        descripcion: payment.description || payment.statement_descriptor || 'Movimiento de MercadoPago',
        fecha: payment.date_created || new Date().toISOString(),
        estado: payment.status || 'pending',
        comprador_email: payment.payer?.email || null,
        metadata: {
          payment_method: payment.payment_method_id,
          payment_type: payment.payment_type_id,
          currency: payment.currency_id,
          ...payment.metadata
        },
        clasificado: false
      }

      // Usar cliente de servidor
      const supabase = createServerSupabaseClient()

      console.log('🔎 Verificando si ya existe en movimientos_pendientes...')

      // Verificar si ya existe en movimientos_pendientes
      const { data: existente, error: selectError } = await supabase
        .from('movimientos_pendientes')
        .select('id')
        .eq('mercadopago_id', movimientoData.mercadopago_id)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('❌ Error verificando movimiento:', selectError)
        return NextResponse.json(
          { error: 'Database error: ' + selectError.message },
          { status: 500 }
        )
      }

      if (existente) {
        console.log(`✏️  Actualizando movimiento existente: ${existente.id}`)
        const { error: updateError } = await supabase
          .from('movimientos_pendientes')
          .update({ estado: movimientoData.estado })
          .eq('id', existente.id)

        if (updateError) {
          console.error('❌ Error actualizando:', updateError)
          return NextResponse.json(
            { error: 'Update error: ' + updateError.message },
            { status: 500 }
          )
        }
      } else {
        console.log('✨ Insertando nuevo movimiento pendiente')
        const { data: inserted, error: insertError } = await supabase
          .from('movimientos_pendientes')
          .insert(movimientoData)

        if (insertError) {
          console.error('❌ Error insertando:', insertError)
          return NextResponse.json(
            { error: 'Insert error: ' + insertError.message },
            { status: 500 }
          )
        }

        console.log('✅ Movimiento insertado correctamente')
      }

      return NextResponse.json({ success: true, message: 'Webhook procesado correctamente' })
    }

    console.log('ℹ️  Event ignorado (no es de tipo payment)')
    return NextResponse.json({ success: true, message: 'Event ignored' })

  } catch (error: any) {
    console.error('❌ Error en webhook:', error)
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    )
  }
}

// GET para verificar que el endpoint está funcionando
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    message: 'MercadoPago webhook endpoint funcionando' 
  })
}
