import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getPayments } from '@/lib/mercadopago'
import { subMonths } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Verificar autenticación
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener pagos de los últimos 3 meses
    const fechaDesde = subMonths(new Date(), 3).toISOString()
    const payments = await getPayments({
      dateFrom: fechaDesde,
      status: 'approved'
    })

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
