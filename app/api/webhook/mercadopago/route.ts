import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { getPaymentById } from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // MercadoPago envía notificaciones de tipo "payment"
    if (body.type === 'payment') {
      const paymentId = body.data?.id

      if (!paymentId) {
        return NextResponse.json({ error: 'No payment ID' }, { status: 400 })
      }

      // Obtener detalles del pago desde MercadoPago
      const payment = await getPaymentById(paymentId.toString())

      if (!payment || !payment.id) {
        return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
      }

      const ingresoData = {
        mercadopago_id: payment.id.toString(),
        monto: payment.transaction_amount || 0,
        descripcion: payment.description || payment.statement_descriptor || 'Pago recibido',
        fecha: payment.date_created || new Date().toISOString(),
        estado: payment.status || 'pending',
        comprador_email: payment.payer?.email || null,
        metadata: {
          payment_method: payment.payment_method_id,
          payment_type: payment.payment_type_id,
          currency: payment.currency_id,
          ...payment.metadata
        }
      }

      // Verificar si ya existe
      const { data: existente } = await supabase
        .from('ingresos')
        .select('id')
        .eq('mercadopago_id', ingresoData.mercadopago_id)
        .single()

      if (existente) {
        // Actualizar
        await supabase
          .from('ingresos')
          .update(ingresoData)
          .eq('id', existente.id)
      } else {
        // Insertar
        await supabase
          .from('ingresos')
          .insert(ingresoData)
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ success: true, message: 'Event ignored' })

  } catch (error: any) {
    console.error('Webhook error:', error)
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
    message: 'MercadoPago webhook endpoint' 
  })
}
