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
    const primerPago = payments.length > 0 ? payments[0] : null

    // Procesar cada pago
    console.log('📝 Procesando pagos...')
    for (const payment of payments) {
      if (!payment.id) continue

      // MercadoPago puede retornar el monto neto en diferentes campos:
      const p = payment as any
      let montoNeto = 0
      let montoOriginal = p.transaction_amount || 0
      let comision = 0
      
      // DEBUG: Log toda la estructura del primer pago
      if (payment.id === primerPago?.id) {
        console.log('📊 ESTRUCTURA COMPLETA DEL PRIMER PAGO:')
        console.log(JSON.stringify(payment, null, 2))
        console.log('Campos disponibles:', Object.keys(payment))
      }
      
      // Intentar obtener el monto neto de diferentes campos posibles
      if (p.net_received_amount !== undefined && p.net_received_amount > 0) {
        montoNeto = p.net_received_amount
        comision = montoOriginal - montoNeto
        console.log(`✅ Usando net_received_amount: ${montoNeto}`)
      } else if (p.net_amount !== undefined && p.net_amount > 0) {
        montoNeto = p.net_amount
        comision = montoOriginal - montoNeto
        console.log(`✅ Usando net_amount: ${montoNeto}`)
      } else if (p.fee !== undefined && typeof p.fee === 'object' && p.fee.amount !== undefined) {
        // MercadoPago retorna las comisiones en un objeto fee
        comision = p.fee.amount
        montoNeto = montoOriginal - comision
        console.log(`✅ Usando fee.amount: comisión=${comision}, neto=${montoNeto}`)
      } else if (p.fees !== undefined && Array.isArray(p.fees) && p.fees.length > 0) {
        // También puede ser un array de fees
        const totalFees = p.fees.reduce((sum: number, fee: any) => {
          if (typeof fee === 'object' && fee.amount !== undefined) {
            return sum + fee.amount
          }
          return sum
        }, 0)
        montoNeto = montoOriginal - totalFees
        comision = totalFees
        console.log(`✅ Usando fees array: comisión=${comision}, neto=${montoNeto}`)
      } else if (p.money_release !== undefined && p.money_release.amount !== undefined) {
        // A veces está en money_release
        montoNeto = p.money_release.amount
        comision = montoOriginal - montoNeto
        console.log(`✅ Usando money_release.amount: ${montoNeto}`)
      } else {
        // Fallback: usar transaction_amount directamente
        montoNeto = montoOriginal
        comision = 0
        console.log(`⚠️ No encontró información de comisión, usando transaction_amount completo: ${montoNeto}`)
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
      DEBUG_primerPago: primerPago // RETORNA EL PAGO COMPLETO PARA VER TODOS LOS CAMPOS
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
