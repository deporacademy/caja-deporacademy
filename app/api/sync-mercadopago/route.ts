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

    // Procesar cada pago
    for (const payment of payments) {
      if (!payment.id) continue

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
        .select('id, estado')
        .eq('mercadopago_id', ingresoData.mercadopago_id)
        .single()

      if (existente) {
        // Actualizar si el estado cambió
        if (existente.estado !== ingresoData.estado) {
          await supabase
            .from('ingresos')
            .update({ estado: ingresoData.estado })
            .eq('id', existente.id)
          actualizados++
        }
      } else {
        // Insertar nuevo
        const { error } = await supabase
          .from('ingresos')
          .insert(ingresoData)
        
        if (!error) nuevos++
      }
    }

    return NextResponse.json({
      success: true,
      total: payments.length,
      nuevos,
      actualizados
    })

  } catch (error: any) {
    console.error('Error syncing MercadoPago:', error)
    return NextResponse.json(
      { error: error.message || 'Error al sincronizar' },
      { status: 500 }
    )
  }
}
