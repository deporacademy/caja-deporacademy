'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

type MovimientoPendiente = {
  id: string
  mercadopago_id: string
  monto: number
  descripcion: string
  fecha: string
  estado: string
  comprador_email: string | null
  clasificado: boolean
}

export default function RevisarMovimientosPage() {
  const [movimientos, setMovimientos] = useState<MovimientoPendiente[]>([])
  const [loading, setLoading] = useState(true)
  const [clasificando, setClasificando] = useState<string | null>(null)

  useEffect(() => {
    cargarMovimientos()
  }, [])

  const cargarMovimientos = async () => {
    try {
      const { data, error } = await supabase
        .from('movimientos_pendientes')
        .select('*')
        .eq('clasificado', false)
        .order('fecha', { ascending: false })

      if (error) throw error
      setMovimientos(data || [])
    } catch (error) {
      console.error('Error cargando movimientos:', error)
    } finally {
      setLoading(false)
    }
  }

  const clasificarMovimiento = async (movimientoId: string, tipo: 'ingreso' | 'gasto') => {
    setClasificando(movimientoId)
    
    try {
      const response = await fetch('/api/clasificar-movimiento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movimientoId, tipo })
      })

      if (!response.ok) throw new Error('Error al clasificar')

      // Remover de la lista
      setMovimientos(prev => prev.filter(m => m.id !== movimientoId))
      
    } catch (error) {
      console.error('Error:', error)
      alert('Error al clasificar el movimiento')
    } finally {
      setClasificando(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Revisar Movimientos</h1>
        <p className="text-gray-600 mt-2">
          Clasifica cada movimiento de MercadoPago como ingreso o gasto
        </p>
      </div>

      {/* Stats */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-600" />
          <span className="font-medium text-primary-900">
            {movimientos.length} movimiento{movimientos.length !== 1 ? 's' : ''} pendiente{movimientos.length !== 1 ? 's' : ''} de clasificar
          </span>
        </div>
      </div>

      {/* Lista de movimientos */}
      {movimientos.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ¡Todo clasificado!
          </h3>
          <p className="text-gray-600">
            No hay movimientos pendientes de revisar
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {movimientos.map((movimiento) => (
            <div
              key={movimiento.id}
              className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-4">
                {/* Info del movimiento */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className={`text-2xl font-bold ${
                      movimiento.monto > 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      ${Math.abs(movimiento.monto).toLocaleString('es-UY', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                      {movimiento.estado}
                    </span>
                  </div>

                  <p className="text-gray-900 font-medium">
                    {movimiento.descripcion}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      {format(new Date(movimiento.fecha), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                    </span>
                    {movimiento.comprador_email && (
                      <>
                        <span>•</span>
                        <span>{movimiento.comprador_email}</span>
                      </>
                    )}
                  </div>

                  <div className="text-xs text-gray-500">
                    ID MercadoPago: {movimiento.mercadopago_id}
                  </div>
                </div>

                {/* Botones de clasificación */}
                <div className="flex flex-col gap-2 min-w-[140px]">
                  <button
                    onClick={() => clasificarMovimiento(movimiento.id, 'ingreso')}
                    disabled={clasificando === movimiento.id}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    Ingreso
                  </button>

                  <button
                    onClick={() => clasificarMovimiento(movimiento.id, 'gasto')}
                    disabled={clasificando === movimiento.id}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    Gasto
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
