'use client'

import { useEffect, useState } from 'react'
import { supabase, type Conversion, type Moneda } from '@/lib/supabase'
import { RefreshCw, TrendingUp, Plus, Trash2, ArrowRightLeft } from 'lucide-react'
import { format } from 'date-fns'

export default function ConversionesPage() {
  const [conversiones, setConversiones] = useState<Conversion[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const [formData, setFormData] = useState({
    fecha: format(new Date(), 'yyyy-MM-dd'),
    monto_origen: '',
    moneda_origen: 'UYU' as Moneda,
    monto_destino: '',
    moneda_destino: 'USD' as Moneda,
    notas: ''
  })

  useEffect(() => {
    loadConversiones()
  }, [])

  async function loadConversiones() {
    try {
      const { data } = await supabase
        .from('conversiones')
        .select('*')
        .order('fecha', { ascending: false })

      setConversiones(data || [])
    } catch (error) {
      console.error('Error loading conversiones:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calcular tipo de cambio automáticamente
  useEffect(() => {
    if (formData.monto_origen && formData.monto_destino) {
      const origen = parseFloat(formData.monto_origen)
      const destino = parseFloat(formData.monto_destino)
      if (origen > 0 && destino > 0) {
        // El tipo de cambio se calcula automáticamente en el backend
      }
    }
  }, [formData.monto_origen, formData.monto_destino])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const origen = parseFloat(formData.monto_origen)
      const destino = parseFloat(formData.monto_destino)
      
      if (origen <= 0 || destino <= 0) {
        alert('Los montos deben ser mayores a 0')
        return
      }

      const tipoCambio = destino / origen

      const conversionData = {
        fecha: formData.fecha,
        monto_origen: origen,
        moneda_origen: formData.moneda_origen,
        monto_destino: destino,
        moneda_destino: formData.moneda_destino,
        tipo_cambio: tipoCambio,
        notas: formData.notas || null
      }

      const { error } = await supabase
        .from('conversiones')
        .insert(conversionData)

      if (error) throw error

      resetForm()
      loadConversiones()
      alert('Conversión registrada exitosamente')
    } catch (error) {
      console.error('Error saving conversion:', error)
      alert('Error al guardar la conversión')
    }
  }

  function resetForm() {
    setFormData({
      fecha: format(new Date(), 'yyyy-MM-dd'),
      monto_origen: '',
      moneda_origen: 'UYU' as Moneda,
      monto_destino: '',
      moneda_destino: 'USD' as Moneda,
      notas: ''
    })
    setShowModal(false)
  }

  function swapMonedas() {
    setFormData(prev => ({
      ...prev,
      moneda_origen: prev.moneda_destino,
      moneda_destino: prev.moneda_origen,
      monto_origen: prev.monto_destino,
      monto_destino: prev.monto_origen
    }))
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar esta conversión?')) return

    try {
      const { error } = await supabase
        .from('conversiones')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadConversiones()
    } catch (error) {
      console.error('Error deleting conversion:', error)
      alert('Error al eliminar la conversión')
    }
  }

  const totalConversiones = conversiones.length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-shimmer w-full max-w-md h-32 rounded-2xl"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <RefreshCw className="w-8 h-8 text-purple-600" />
            Conversiones de Moneda
          </h1>
          <p className="text-slate-600">Registra los cambios entre USD y UYU</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Conversión
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200/60">
          <h3 className="text-sm font-semibold text-slate-600 mb-1">Total Conversiones</h3>
          <p className="text-3xl font-bold text-purple-700">{totalConversiones}</p>
        </div>
      </div>

      {/* Lista de conversiones */}
      <div className="grid gap-4">
        {conversiones.map((conversion) => (
          <div key={conversion.id} className="card p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900">
                      ${Number(conversion.monto_origen).toLocaleString('es-UY')} {conversion.moneda_origen}
                    </span>
                    <ArrowRightLeft className="w-5 h-5 text-purple-600" />
                    <span className="text-lg font-bold text-purple-700">
                      ${Number(conversion.monto_destino).toLocaleString('es-UY')} {conversion.moneda_destino}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  {format(new Date(conversion.fecha), 'dd/MM/yyyy')}
                </p>
                <p className="text-sm text-slate-500">
                  Tipo de cambio: <span className="font-semibold">{Number(conversion.tipo_cambio).toFixed(4)}</span>
                </p>
                {conversion.notas && (
                  <p className="text-sm text-slate-500 italic mt-2">{conversion.notas}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDelete(conversion.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {conversiones.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            No hay conversiones registradas. Agrega tu primera conversión.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card p-8 max-w-lg w-full animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Nueva Conversión</h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Fecha *
                </label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              {/* Origen */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Moneda Origen</h3>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="moneda_origen"
                        value="UYU"
                        checked={formData.moneda_origen === 'UYU'}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          moneda_origen: e.target.value as Moneda,
                          moneda_destino: e.target.value === 'UYU' ? 'USD' : 'UYU'
                        })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-medium text-slate-700">🪙 Pesos (UYU)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="moneda_origen"
                        value="USD"
                        checked={formData.moneda_origen === 'USD'}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          moneda_origen: e.target.value as Moneda,
                          moneda_destino: e.target.value === 'USD' ? 'UYU' : 'USD'
                        })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-medium text-slate-700">💵 Dólares (USD)</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monto_origen}
                    onChange={(e) => setFormData({ ...formData, monto_origen: e.target.value })}
                    className="input-field"
                    placeholder="Monto a cambiar"
                    required
                  />
                </div>
              </div>

              {/* Botón de intercambio */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={swapMonedas}
                  className="p-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full transition-colors"
                  title="Intercambiar monedas"
                >
                  <ArrowRightLeft className="w-5 h-5" />
                </button>
              </div>

              {/* Destino */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">Moneda Destino</h3>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="moneda_destino"
                        value="UYU"
                        checked={formData.moneda_destino === 'UYU'}
                        onChange={(e) => setFormData({ ...formData, moneda_destino: e.target.value as Moneda })}
                        className="w-4 h-4 text-blue-600"
                        disabled
                      />
                      <span className="text-sm font-medium text-slate-700">🪙 Pesos (UYU)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="moneda_destino"
                        value="USD"
                        checked={formData.moneda_destino === 'USD'}
                        onChange={(e) => setFormData({ ...formData, moneda_destino: e.target.value as Moneda })}
                        className="w-4 h-4 text-blue-600"
                        disabled
                      />
                      <span className="text-sm font-medium text-slate-700">💵 Dólares (USD)</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monto_destino}
                    onChange={(e) => setFormData({ ...formData, monto_destino: e.target.value })}
                    className="input-field"
                    placeholder="Monto recibido"
                    required
                  />
                </div>
              </div>

              {/* Tipo de cambio calculado */}
              {formData.monto_origen && formData.monto_destino && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold">Tipo de cambio:</span>{' '}
                    {(parseFloat(formData.monto_destino) / parseFloat(formData.monto_origen)).toFixed(4)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Casa de cambio, detalles adicionales..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  Guardar Conversión
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
