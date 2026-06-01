import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Nota: Autenticación ahora manejada en client-side con localStorage

    const { movimientoId, tipo } = await request.json()

    if (!movimientoId || !tipo || !['ingreso', 'gasto'].includes(tipo)) {
      return NextResponse.json(
        { error: 'Datos inválidos' },
        { status: 400 }
      )
    }

    // Obtener el movimiento pendiente
    const { data: movimiento, error: fetchError } = await supabase
      .from('movimientos_pendientes')
      .select('*')
      .eq('id', movimientoId)
      .single()

    if (fetchError || !movimiento) {
      return NextResponse.json(
        { error: 'Movimiento no encontrado' },
        { status: 404 }
      )
    }

    if (tipo === 'ingreso') {
      // Mover a tabla de ingresos
      const { error: insertError } = await supabase
        .from('ingresos')
        .insert({
          mercadopago_id: movimiento.mercadopago_id,
          monto: movimiento.monto,
          descripcion: movimiento.descripcion,
          fecha: movimiento.fecha,
          estado: movimiento.estado,
          comprador_email: movimiento.comprador_email,
          metadata: movimiento.metadata
        })

      if (insertError) {
        // Si ya existe en ingresos, solo marcar como clasificado
        if (insertError.code === '23505') { // código de violación de unique constraint
          await supabase
            .from('movimientos_pendientes')
            .update({ clasificado: true })
            .eq('id', movimientoId)
          
          return NextResponse.json({ success: true, mensaje: 'Ya existía como ingreso' })
        }
        throw insertError
      }
    } else {
      // Mover a tabla de gastos (sin categoria inicialmente)
      const { error: insertError } = await supabase
        .from('gastos')
        .insert({
          monto: Math.abs(movimiento.monto), // Gastos siempre positivos
          descripcion: movimiento.descripcion || 'Gasto desde MercadoPago',
          fecha: movimiento.fecha,
          categoria_id: null, // Sin categoría por defecto
          notas: `Sincronizado desde MercadoPago (ID: ${movimiento.mercadopago_id})`
        })

      if (insertError) {
        throw insertError
      }
    }

    // Marcar como clasificado
    await supabase
      .from('movimientos_pendientes')
      .update({ clasificado: true })
      .eq('id', movimientoId)

    return NextResponse.json({
      success: true,
      tipo,
      mensaje: `Movimiento clasificado como ${tipo}`
    })

  } catch (error: any) {
    console.error('Error clasificando movimiento:', error)
    return NextResponse.json(
      { error: error.message || 'Error al clasificar movimiento' },
      { status: 500 }
    )
  }
}
