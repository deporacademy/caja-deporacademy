'use client'

import { useEffect, useState } from 'react'
import { supabase, type Categoria, type CategoriaIngreso } from '@/lib/supabase'
import { Settings, Plus, Edit2, Trash2, X, RefreshCw } from 'lucide-react'

export default function SettingsPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [categoriasIngresos, setCategoriasIngresos] = useState<CategoriaIngreso[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showModalIngreso, setShowModalIngreso] = useState(false)
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [editingCategoriaIngreso, setEditingCategoriaIngreso] = useState<CategoriaIngreso | null>(null)
  const [syncing, setSyncing] = useState(false)

  const [formData, setFormData] = useState({
    nombre: '',
    color: '#3B82F6'
  })

  const [formDataIngreso, setFormDataIngreso] = useState({
    nombre: '',
    color: '#10B981'
  })

  useEffect(() => {
    loadCategorias()
    loadCategoriasIngresos()
  }, [])

  async function loadCategorias() {
    try {
      const { data } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre')

      setCategorias(data || [])
    } catch (error) {
      console.error('Error loading categorias:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadCategoriasIngresos() {
    try {
      const { data } = await supabase
        .from('categorias_ingresos')
        .select('*')
        .order('nombre')

      setCategoriasIngresos(data || [])
    } catch (error) {
      console.error('Error loading categorias ingresos:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const url = '/api/categorias'
      const method = editingCategoria ? 'PUT' : 'POST'
      const body = editingCategoria
        ? { id: editingCategoria.id, ...formData }
        : formData

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar')
      }

      resetForm()
      loadCategorias()
    } catch (error) {
      console.error('Error saving categoria:', error)
      alert('Error al guardar la categoría: ' + (error as Error).message)
    }
  }

  function resetForm() {
    setFormData({ nombre: '', color: '#3B82F6' })
    setEditingCategoria(null)
    setShowModal(false)
  }

  function handleEdit(categoria: Categoria) {
    setEditingCategoria(categoria)
    setFormData({
      nombre: categoria.nombre,
      color: categoria.color
    })
    setShowModal(true)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return

    try {
      const response = await fetch(`/api/categorias?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar')
      }

      loadCategorias()
    } catch (error) {
      console.error('Error deleting categoria:', error)
      alert('Error al eliminar la categoría: ' + (error as Error).message)
    }
  }

  // Funciones para categorías de ingresos
  async function handleSubmitIngreso(e: React.FormEvent) {
    e.preventDefault()

    try {
      const url = '/api/categorias-ingreso'
      const method = editingCategoriaIngreso ? 'PUT' : 'POST'
      const body = editingCategoriaIngreso
        ? { id: editingCategoriaIngreso.id, ...formDataIngreso }
        : formDataIngreso

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al guardar')
      }

      resetFormIngreso()
      loadCategoriasIngresos()
    } catch (error) {
      console.error('Error saving categoria ingreso:', error)
      alert('Error al guardar la categoría: ' + (error as Error).message)
    }
  }

  function resetFormIngreso() {
    setFormDataIngreso({ nombre: '', color: '#10B981' })
    setEditingCategoriaIngreso(null)
    setShowModalIngreso(false)
  }

  function handleEditIngreso(categoria: CategoriaIngreso) {
    setEditingCategoriaIngreso(categoria)
    setFormDataIngreso({
      nombre: categoria.nombre,
      color: categoria.color
    })
    setShowModalIngreso(true)
  }

  async function handleDeleteIngreso(id: string) {
    if (!confirm('¿Estás seguro de eliminar esta categoría?')) return

    try {
      const response = await fetch(`/api/categorias-ingreso?id=${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al eliminar')
      }

      loadCategoriasIngresos()
    } catch (error) {
      console.error('Error deleting categoria ingreso:', error)
      alert('Error al eliminar la categoría: ' + (error as Error).message)
    }
  }

  async function syncMercadoPago() {
    setSyncing(true)
    try {
      const response = await fetch('/api/sync-mercadopago')
      const result = await response.json()
      
      if (response.ok) {
        alert(`Sincronización completada:\n- ${result.nuevos} nuevos pagos\n- ${result.actualizados} actualizados\n- ${result.total} total procesados`)
      } else {
        alert('Error al sincronizar: ' + result.error)
      }
    } catch (error) {
      alert('Error al sincronizar con MercadoPago')
    } finally {
      setSyncing(false)
    }
  }

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
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <Settings className="w-8 h-8 text-slate-700" />
          Configuración
        </h1>
        <p className="text-slate-600">Gestiona las categorías y ajustes del sistema</p>
      </div>

      {/* Sincronización */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Sincronización MercadoPago</h2>
        <p className="text-slate-600 mb-4">
          Sincroniza manualmente los pagos de MercadoPago de los últimos 3 meses.
        </p>
        <button
          onClick={syncMercadoPago}
          disabled={syncing}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
        </button>
      </div>

      {/* Categorías de Ingresos */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Categorías de Ingresos</h2>
          <button
            onClick={() => setShowModalIngreso(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nueva Categoría
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoriasIngresos.map((categoria) => (
            <div
              key={categoria.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all hover:shadow-md"
              style={{ borderLeftWidth: '4px', borderLeftColor: categoria.color }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: categoria.color }}
                    />
                    <h3 className="font-semibold text-slate-900">{categoria.nombre}</h3>
                  </div>
                  <p className="text-xs text-slate-500">{categoria.color}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEditIngreso(categoria)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteIngreso(categoria.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Categorías de Gastos */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900">Categorías de Gastos</h2>
          <button
            onClick={() => setShowModal(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Nueva Categoría
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categorias.map((categoria) => (
            <div
              key={categoria.id}
              className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all hover:shadow-md"
              style={{ borderLeftWidth: '4px', borderLeftColor: categoria.color }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: categoria.color }}
                    />
                    <h3 className="font-semibold text-slate-900">{categoria.nombre}</h3>
                  </div>
                  <p className="text-xs text-slate-500">{categoria.color}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(categoria)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(categoria.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info del Sistema */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Información del Sistema</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Versión</span>
            <span className="font-semibold">1.0.0</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Base de datos</span>
            <span className="font-semibold">Supabase</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-600">Pagos</span>
            <span className="font-semibold">MercadoPago Uruguay</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-slate-600">Deploy</span>
            <span className="font-semibold">Vercel</span>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card p-8 max-w-md w-full animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingCategoria ? 'Editar Categoría' : 'Nueva Categoría'}
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
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="input-field"
                  placeholder="Ej: Marketing"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Color *
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-16 h-12 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="input-field flex-1"
                    placeholder="#3B82F6"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    required
                  />
                </div>
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
                  {editingCategoria ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para categorías de ingresos */}
      {showModalIngreso && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card p-8 max-w-md w-full animate-slide-up">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingCategoriaIngreso ? 'Editar Categoría de Ingreso' : 'Nueva Categoría de Ingreso'}
              </h2>
              <button
                onClick={resetFormIngreso}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitIngreso} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formDataIngreso.nombre}
                  onChange={(e) => setFormDataIngreso({ ...formDataIngreso, nombre: e.target.value })}
                  className="input-field"
                  placeholder="Ej: Venta libros MP"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Color *
                </label>
                <div className="flex gap-3">
                  <input
                    type="color"
                    value={formDataIngreso.color}
                    onChange={(e) => setFormDataIngreso({ ...formDataIngreso, color: e.target.value })}
                    className="w-16 h-12 rounded-lg border border-slate-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formDataIngreso.color}
                    onChange={(e) => setFormDataIngreso({ ...formDataIngreso, color: e.target.value })}
                    className="input-field flex-1"
                    placeholder="#10B981"
                    pattern="^#[0-9A-Fa-f]{6}$"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetFormIngreso}
                  className="flex-1 btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                >
                  {editingCategoriaIngreso ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
