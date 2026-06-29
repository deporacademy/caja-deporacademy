'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, RefreshCw, Trash2, RotateCcw } from 'lucide-react'
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
  descartado?: boolean
}

type Tab = 'pendientes' | 'descartados'

export default function RevisarMovimientosPage() {
  const [movimientos, setMovimientos] = useState<MovimientoPendiente[]>([])
  const [loading, setLoading] = useState(true)
  const [clasificando, setClasificando] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [tab, setTab] = useState<Tab>('pendientes')

  useEffect(() => {
    cargarMovimientos()
  }, [tab])

  const cargarMovimientos = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('movimientos_pendientes')
        .select('*')
        .eq('clasificado', false)
        .eq('descartado', tab === 'descartados')
        .order('fecha', { ascending: false })

      if (error) throw error
      setMovimientos(data || [])
    } catch (error) {
      console.error('Error cargando movimientos:', error)
    } finally {
      setLoading(false)
    }
  }

  const sincronizarMercadoPago = async () => {
    setSyncing(true)
    try {
      const response = await fetch('/api/sync-mercadopago')
      const result = await response.json()
      
      if (response.ok) {
        alert(result.mensaje || `Sincronizados: ${result.nuevos} nuevos movimientos`)
        cargarMovimientos()
      } else {
        alert('Error al sincronizar: ' + result.error)
      }
    } catch (error) {
      alert('Error al sincronizar con MercadoPago')
    } finally {
      setSyncing(false)
    }
  }

  const descartarMovimiento = async (movimientoId: string) => {
    setClasificando(movimientoId)
    try {
      const { error } = await supabase
        .from('movimientos_pendientes')
        .update({ descartado: true })
        .eq('id', movimientoId)

      if (error) throw error
      setMovimientos(prev => prev.filter(m => m.id !== movimientoId))
    } catch (error) {
      console.error('Error:', error)
      alert('Error al descartar el movimiento')
    } finally {
      setClasificando(null)
    }
  }

  const restaurarMovimiento = async (movimientoId: string) => {
    setClasificando(movimientoId)
    try {
      const { error } = await supabase
        .from('movimientos_pendientes')
        .update({ descartado: false })
        .eq('id', movimientoId)

      if (error) throw error
      setMovimientos(prev => prev.filter(m => m.id !== movimientoId))
    } catch (error) {
      console.error('Error:', error)
      alert('Error al restaurar el movimiento')
    } finally {
      setClasificando(null)
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revisar Movimientos</h1>
          <p className="text-gray-600 mt-2">
            Clasifica cada movimiento de MercadoPago como ingreso o gasto
          </p>
        </div>
        <button
          onClick={sincronizarMercadoPago}
          disabled={syncing}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar MP'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setTab('pendientes')}
          className={`px-4 py-3 font-medium transition-colors ${
            tab === 'pendientes'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Pendientes
        </button>
        <button
          onClick={() => setTab('descartados')}
          className={`px-4 py-3 font-medium transition-colors ${
            tab === 'descartados'
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Descartados
        </button>
      </div>

      {/* Stats */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-600" />
          <span className="font-medium text-primary-900">
            {movimientos.length} movimiento{movimientos.length !== 1 ? 's' : ''} {
              tab === 'pendientes' 
                ? `pendiente${movimientos.length !== 1 ? 's' : ''} de clasificar`
                : `descartado${movimientos.length !== 1 ? 's' : ''}`
            }
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
                    {/* Sugerencia basada en el signo */}
                    <span className={`px-2 py-1 text-xs font-medium rounded ${
                      movimiento.monto > 0 
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {movimiento.monto > 0 ? '↓ Probable ingreso' : '↑ Probable gasto'}
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
                  {tab === 'pendientes' ? (
                    <>
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

                      <button
                        onClick={() => descartarMovimiento(movimiento.id)}
                        disabled={clasificando === movimiento.id}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                        Descartar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => restaurarMovimiento(movimiento.id)}
                      disabled={clasificando === movimiento.id}
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Restaurar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
