import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getPayments } from '@/lib/mercadopago'
import { subMonths } from 'date-fns'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  console.log('🚀 SYNC-MERCADOPAGO: Iniciando sincronización...')
  
  // Validar que MERCADOPAGO_ACCESS_TOKEN esté configurado
  if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
    console.error('❌ MERCADOPAGO_ACCESS_TOKEN no está configurado en variables de entorno')
    return NextResponse.json({
      success: false,
      error: 'MERCADOPAGO_ACCESS_TOKEN no configurado',
      detalles: 'Verifica que esté en Vercel → Settings → Environment Variables'
    }, { status: 500 })
  }
  
  try {
    console.log('📦 Creando cliente de Supabase...')
    const supabase = createServerSupabaseClient()
    
    console.log('⏰ Calculando fecha desde...')
    // Obtener pagos de los últimos 3 meses
    const fechaDesde = subMonths(new Date(), 3).toISOString()
    console.log('📅 Buscando pagos desde:', fechaDesde)
    
    console.log('🔍 Llamando a getPayments...')
    const payments = await getPayments({
      dateFrom: fechaDesde,
      status: 'approved'
    })
    
    console.log(`✅ Se encontraron ${payments.length} pagos`)

    let nuevos = 0
    let actualizados = 0

    // Procesar cada pago
    console.log('📝 Procesando pagos...')
    for (const payment of payments) {
      if (!payment.id) continue

      // MercadoPago puede retornar el monto neto en diferentes campos:
      // - net_received_amount (monto neto recibido)
      // - transaction_amount (monto bruto, lo que pagó el cliente)
      // - Calcular: net = gross - fees
      
      const p = payment as any
      let montoNeto = 0
      let montoOriginal = p.transaction_amount || 0
      let comision = 0
      
      // Intentar obtener el monto neto de diferentes campos posibles
      if (p.net_received_amount !== undefined) {
        montoNeto = p.net_received_amount
        comision = montoOriginal - montoNeto
        console.log(`✅ Usando net_received_amount: ${montoNeto}`)
      } else if (p.net_amount !== undefined) {
        montoNeto = p.net_amount
        comision = montoOriginal - montoNeto
        console.log(`✅ Usando net_amount: ${montoNeto}`)
      } else if (p.fees !== undefined && Array.isArray(p.fees)) {
        // Calcular sumando las comisiones
        const totalFees = p.fees.reduce((sum: number, fee: any) => sum + (fee.amount || 0), 0)
        montoNeto = montoOriginal - totalFees
        comision = totalFees
        console.log(`✅ Usando fees array: ${montoNeto}`)
      } else {
        // Fallback: usar transaction_amount directamente
        montoNeto = montoOriginal
        console.log(`⚠️ No encontró monto neto, usando transaction_amount: ${montoNeto}`)
      }
      
      console.log(`💰 Pago ${p.id}: Original=${montoOriginal}, Neto=${montoNeto}, Comisión=${comision}`)
      
      const movimientoData = {
        mercadopago_id: payment.id.toString(),
        monto: montoNeto,
        descripcion: payment.description || payment.statement_descriptor || 'Movimiento de MercadoPago',
        fecha: payment.date_created || new Date().toISOString(),
        estado: payment.status || 'pending',
        comprador_email: payment.payer?.email || null,
        metadata: {
          payment_method: payment.payment_method_id,
          payment_type: payment.payment_type_id,
          currency: payment.currency_id,
          monto_original: montoOriginal,
          monto_neto: montoNeto,
          comision_mercadopago: comision,
          ...payment.metadata
        },
        clasificado: false
      }

      // Verificar si ya existe en movimientos pendientes
      const { data: existente, error: selectError } = await supabase
        .from('movimientos_pendientes')
        .select('id, estado, clasificado')
        .eq('mercadopago_id', movimientoData.mercadopago_id)
        .single()

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('❌ Error SELECT movimientos_pendientes:', selectError)
        throw selectError
      }

      if (existente) {
        // Actualizar si cambió el estado y no ha sido clasificado
        if (!existente.clasificado && existente.estado !== movimientoData.estado) {
          const { error: updateError } = await supabase
            .from('movimientos_pendientes')
            .update({ estado: movimientoData.estado })
            .eq('id', existente.id)
          
          if (updateError) {
            console.error('❌ Error UPDATE movimientos_pendientes:', updateError)
            throw updateError
          }
          actualizados++
        }
      } else {
        // Insertar nuevo movimiento pendiente
        const { error: insertError } = await supabase
          .from('movimientos_pendientes')
          .insert(movimientoData)
        
        if (insertError) {
          console.error('❌ Error INSERT movimientos_pendientes:', insertError)
          throw insertError
        }
        
        nuevos++
      }
    }

    console.log(`✅ Sincronización completada: ${nuevos} nuevos, ${actualizados} actualizados`)
    
    return NextResponse.json({
      success: true,
      total: payments.length,
      nuevos,
      actualizados,
      mensaje: 'Movimientos sincronizados. Por favor revísalos y clasifícalos.',
      primerPago: payments.length > 0 ? {
        id: payments[0].id,
        transaction_amount: (payments[0] as any).transaction_amount,
        net_received_amount: (payments[0] as any).net_received_amount,
        monto_neto: (payments[0] as any).net_received_amount || (payments[0] as any).transaction_amount,
        todosLosCampos: payments[0]
      } : null
    })

  } catch (error: any) {
    console.error('❌ ERROR EN SYNC-MERCADOPAGO:', {
      message: error.message,
      code: error.code,
      status: error.status,
      details: error
    })
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Error al sincronizar',
      details: error.code || error.status || 'Unknown error'
    }, { status: 500 })
  }
}
