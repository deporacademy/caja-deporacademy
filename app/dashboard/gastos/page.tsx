'use client'

import { useEffect, useState } from 'react'
import { supabase, type Gasto, type Categoria } from '@/lib/supabase'
import { TrendingDown, Plus, Search, Edit2, Trash2, X, FileText, Image as ImageIcon, Eye } from 'lucide-react'
import { format } from 'date-fns'

export default function GastosPage() {
  const [gastos, setGastos] = useState<any[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingGasto, setEditingGasto] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategoria, setFilterCategoria] = useState<string>('all')
  const [comprobante, setComprobante] = useState<string | null>(null)
  const [viewingComprobante, setViewingComprobante] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    monto: '',
    descripcion: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    categoria_id: '',
    notas: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: gastosData } = await supabase
        .from('gastos')
        .select('*, categorias(id, nombre, color)')
        .order('fecha', { ascending: false })

      const { data: categoriasData } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre')

      setGastos(gastosData || [])
      setCategorias(categoriasData || [])
      if (categoriasData && categoriasData.length > 0) {
        setFormData(prev => ({ ...prev, categoria_id: categoriasData[0].id }))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const gastoData = {
        monto: parseFloat(formData.monto),
        descripcion: formData.descripcion,
        fecha: formData.fecha,
        categoria_id: formData.categoria_id || null,
        notas: formData.notas || null,
        comprobante_base64: comprobante
      }

      if (editingGasto) {
        const { error } = await supabase
          .from('gastos')
          .update(gastoData)
          .eq('id', editingGasto.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('gastos')
          .insert(gastoData)

        if (error) throw error
      }

      resetForm()
      loadData()
    } catch (error) {
      console.error('Error saving gasto:', error)
      alert('Error al guardar el gasto')
    }
  }

  function resetForm() {
    setFormData({
      monto: '',
      descripcion: '',
      fecha: format(new Date(), 'yyyy-MM-dd'),
      categoria_id: categorias[0]?.id || '',
      notas: ''
    })
    setComprobante(null)
    setEditingGasto(null)
    setShowModal(false)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setComprobante(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  function handleEdit(gasto: any) {
    setEditingGasto(gasto)
    setFormData({
      monto: gasto.monto.toString(),
      descripcion: gasto.descripcion,
      fecha: gasto.fecha,
      categoria_id: gasto.categoria_id || '',
      notas: gasto.notas || ''
    })
    setComprobante(gasto.comprobante_base64 || null)
    setShowModal(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return

    try {
      const { error } = await supabase
        .from('gastos')
        .delete()
        .eq('id', id)

      if (error) throw error
      loadData()
    } catch (error) {
      console.error('Error deleting gasto:', error)
      alert('Error al eliminar el gasto')
    }
  }

  const gastosFiltrados = gastos.filter(gasto => {
    const matchSearch = gasto.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCategoria = filterCategoria === 'all' || gasto.categoria_id === filterCategoria
    return matchSearch && matchCategoria
  })

  const totalGastos = gastosFiltrados.reduce((sum, gasto) => sum + Number(gasto.monto), 0)

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
            <TrendingDown className="w-8 h-8 text-red-600" />
            Gastos
          </h1>
          <p className="text-slate-600">Registra y gestiona los gastos de la empresa</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Gasto
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card bg-gradient-to-br from-red-50 to-orange-50 border-red-200/60">
          <h3 className="text-sm font-semibold text-slate-600 mb-1">Total Gastos</h3>
          <p className="text-3xl font-bold text-red-700">${totalGastos.toLocaleString('es-UY')}</p>
        </div>
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-slate-600 mb-1">Cantidad</h3>
          <p className="text-3xl font-bold text-slate-900">{gastosFiltrados.length}</p>
        </div>
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-slate-600 mb-1">Promedio</h3>
          <p className="text-3xl font-bold text-slate-900">
            ${gastosFiltrados.length > 0 ? (totalGastos / gastosFiltrados.length).toFixed(0) : '0'}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <select
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            className="input-field md:w-64"
          >
            <option value="all">Todas las categorías</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de gastos */}
      <div className="grid gap-4">
        {gastosFiltrados.map((gasto) => (
          <div key={gasto.id} className="card p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-bold text-slate-900">{gasto.descripcion}</h3>
                  {gasto.categorias && (
                    <span 
                      className="badge text-xs"
                      style={{ 
                        backgroundColor: `${gasto.categorias.color}20`,
                        color: gasto.categorias.color,
                        borderColor: `${gasto.categorias.color}40`
                      }}
                    >
                      {gasto.categorias.nombre}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-1">
                  {format(new Date(gasto.fecha), 'dd/MM/yyyy')}
                </p>
                {gasto.notas && (
                  <p className="text-sm text-slate-500 italic">{gasto.notas}</p>
                )}
                {gasto.comprobante_base64 && (
                  <button
                    onClick={() => setViewingComprobante(gasto.comprobante_base64)}
                    className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    <ImageIcon className="w-4 h-4" />
                    Ver comprobante
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-red-700">
                  ${Number(gasto.monto).toLocaleString('es-UY')}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(gasto)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(gasto.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {gastosFiltrados.length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            {searchTerm || filterCategoria !== 'all' 
              ? 'No se encontraron gastos con los filtros seleccionados'
              : 'No hay gastos registrados. Agrega tu primer gasto.'}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card p-8 max-w-lg w-full animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 -mx-8 px-8">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingGasto ? 'Editar Gasto' : 'Nuevo Gasto'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Monto *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monto}
                  onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                  className="input-field"
                  placeholder="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Descripción *
                </label>
                <input
                  type="text"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="input-field"
                  placeholder="Compra de material"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
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

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Categoría
                  </label>
                  <select
                    value={formData.categoria_id}
                    onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                    className="input-field"
                  >
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="input-field resize-none"
                  rows={3}
                  placeholder="Información adicional..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Comprobante (opcional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="input-field"
                />
                {comprobante && (
                  <div className="mt-2">
                    <img src={comprobante} alt="Comprobante" className="max-w-xs rounded border" />
                  </div>
                )}
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
                  {editingGasto ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de visualización de comprobante */}
      {viewingComprobante && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in"
          onClick={() => setViewingComprobante(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] animate-slide-up">
            <button
              onClick={() => setViewingComprobante(null)}
              className="absolute -top-12 right-0 p-2 bg-white hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={viewingComprobante} 
              alt="Comprobante" 
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
