import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getPayments } from '@/lib/mercadopago'
import { subMonths } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: any[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // No-op: Cookies cannot be set in Server Components
            }
          },
        },
      }
    )

    // Nota: Autenticación ahora manejada en client-side con localStorage
    // Este endpoint se llama desde el dashboard ya autenticado
    
    // Obtener pagos de los últimos 3 meses
    const fechaDesde = subMonths(new Date(), 3).toISOString()
    const payments = await getPayments({
      dateFrom: fechaDesde,
      status: 'approved'
    })

    // DEBUG: Ver datos completos de los primeros pagos
    if (payments.length > 0) {
      console.log('=== EJEMPLO DE PAYMENT ===')
      console.log('Payment completo:', JSON.stringify(payments[0], null, 2))
      console.log('transaction_amount:', payments[0].transaction_amount)
      console.log('operation_type:', payments[0].operation_type)
      console.log('transaction_details:', payments[0].transaction_details)
      console.log('========================')
    }

    let nuevos = 0
    let actualizados = 0

    // Procesar cada pago y clasificarlo automáticamente por el signo del monto
    for (const payment of payments) {
      if (!payment.id) continue

      const monto = payment.transaction_amount || 0
      
      // CLASIFICACIÓN AUTOMÁTICA:
      // Monto positivo (+) = INGRESO (ventas, cobros)
      // Monto negativo (-) = GASTO (compras, pagos)
      const esIngreso = monto > 0
      const esGasto = monto < 0

      const movimientoData = {
        mercadopago_id: payment.id.toString(),
        monto: monto,
        descripcion: payment.description || payment.statement_descriptor || 'Movimiento de MercadoPago',
        fecha: payment.date_created || new Date().toISOString(),
        estado: payment.status || 'pending',
        comprador_email: payment.payer?.email || null,
        metadata: {
          payment_method: payment.payment_method_id,
          payment_type: payment.payment_type_id,
          currency: payment.currency_id,
          tipo_detectado: esIngreso ? 'ingreso' : 'gasto',
          ...payment.metadata
        },
        clasificado: false
      }

      // Verificar si ya existe en movimientos pendientes
      const { data: existente } = await supabase
        .from('movimientos_pendientes')
        .select('id, estado, clasificado')
        .eq('mercadopago_id', movimientoData.mercadopago_id)
        .single()

      if (existente) {
        // Actualizar si cambió el estado y no ha sido clasificado
        if (!existente.clasificado && existente.estado !== movimientoData.estado) {
          await supabase
            .from('movimientos_pendientes')
            .update({ estado: movimientoData.estado })
            .eq('id', existente.id)
          actualizados++
        }
      } else {
        // Insertar nuevo movimiento pendiente
        const { error } = await supabase
          .from('movimientos_pendientes')
          .insert(movimientoData)
        
        if (!error) nuevos++
      }
    }

    return NextResponse.json({
      success: true,
      total: payments.length,
      nuevos,
      actualizados,
      mensaje: 'Movimientos sincronizados. Por favor revísalos y clasifícalos.'
    })

  } catch (error: any) {
    console.error('Error syncing MercadoPago:', error)
    return NextResponse.json(
      { error: error.message || 'Error al sincronizar' },
      { status: 500 }
    )
  }
}
