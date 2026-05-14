'use client'

import { useEffect, useState } from 'react'
import { supabase, type Ingreso, type CategoriaIngreso, type Moneda } from '@/lib/supabase'
import { TrendingUp, Search, Download, Trash2, Plus, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function IngresosPage() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [categorias, setCategorias] = useState<CategoriaIngreso[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingIngreso, setEditingIngreso] = useState<any>(null)
  const [comprobante, setComprobante] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    monto: '',
    descripcion: '',
    fecha: format(new Date(), 'yyyy-MM-dd'),
    categoria_id: '',
    comprador_email: '',
    moneda: 'UYU' as Moneda,
    estado: 'approved'
  })

  useEffect(() => {
    loadIngresos()
    loadCategorias()
  }, [])

  async function loadIngresos() {
    try {
      const { data } = await supabase
        .from('ingresos')
        .select('*')
        .order('fecha', { ascending: false })

      setIngresos(data || [])
    } catch (error) {
      console.error('Error loading ingresos:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadCategorias() {
    try {
      const { data } = await supabase
        .from('categorias_ingresos')
        .select('*')
        .order('nombre')

      setCategorias(data || [])
      if (data && data.length > 0) {
        setFormData(prev => ({ ...prev, categoria_id: data[0].id }))
      }
    } catch (error) {
      console.error('Error loading categorias:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      const ingresoData: any = {
        monto: parseFloat(formData.monto),
        descripcion: formData.descripcion,
        fecha: formData.fecha,
        categoria_id: formData.categoria_id,
        comprador_email: formData.comprador_email,
        estado: formData.estado,
        mercadopago_id: `MANUAL-${Date.now()}`,
        comprobante_base64: comprobante,
        metadata: { tipo: 'manual' }
      }

      // Solo incluir moneda si el campo existe en la BD
      if (formData.moneda) {
        ingresoData.moneda = formData.moneda
      }

      if (editingIngreso) {
        const { error } = await supabase
          .from('ingresos')
          .update(ingresoData)
          .eq('id', editingIngreso.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('ingresos')
          .insert(ingresoData)

        if (error) throw error
      }

      resetForm()
      loadIngresos()
    } catch (error) {
      console.error('Error saving ingreso:', error)
      alert('Error al guardar el ingreso')
    }
  }

  function resetForm() {
    setFormData({
      monto: '',
      descripcion: '',
      fecha: format(new Date(), 'yyyy-MM-dd'),
      categoria_id: categorias[0]?.id || '',
      comprador_email: '',
      moneda: 'UYU' as Moneda,
      estado: 'approved'
    })
    setComprobante(null)
    setEditingIngreso(null)
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

  async function eliminarIngreso(id: string) {
    if (!confirm('¿Estás seguro de eliminar este ingreso?')) return

    try {
      const { error } = await supabase
        .from('ingresos')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Ingreso eliminado correctamente')
      loadIngresos()
    } catch (error) {
      console.error('Error:', error)
      alert('Error al eliminar el ingreso')
    }
  }

  const ingresosFiltrados = ingresos.filter(ingreso => {
    const matchSearch = 
      ingreso.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingreso.comprador_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ingreso.mercadopago_id.includes(searchTerm)
    
    const matchEstado = filterEstado === 'all' || ingreso.estado === filterEstado
    
    return matchSearch && matchEstado
  })

  const totalIngresos = ingresosFiltrados
    .filter(i => i.estado === 'approved')
    .reduce((sum, ing) => sum + Number(ing.monto), 0)

  const exportToCSV = () => {
    const headers = ['Fecha', 'Descripción', 'Monto', 'Estado', 'Email Comprador', 'ID MercadoPago']
    const rows = ingresosFiltrados.map(ing => [
      format(new Date(ing.fecha), 'dd/MM/yyyy HH:mm'),
      ing.descripcion || '',
      ing.monto,
      ing.estado,
      ing.comprador_email || '',
      ing.mercadopago_id
    ])

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ingresos-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-green-600" />
            Ingresos
          </h1>
          <p className="text-slate-600">Pagos recibidos desde MercadoPago</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nuevo Ingreso
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/60">
          <h3 className="text-sm font-semibold text-slate-600 mb-1">Total Aprobados</h3>
          <p className="text-3xl font-bold text-green-700">${totalIngresos.toLocaleString('es-UY')}</p>
        </div>
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-slate-600 mb-1">Total Transacciones</h3>
          <p className="text-3xl font-bold text-slate-900">{ingresosFiltrados.length}</p>
        </div>
        <div className="stat-card">
          <h3 className="text-sm font-semibold text-slate-600 mb-1">Pendientes</h3>
          <p className="text-3xl font-bold text-amber-600">
            {ingresosFiltrados.filter(i => i.estado === 'pending').length}
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
                placeholder="Buscar por descripción, email o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
              />
            </div>
          </div>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="input-field md:w-48"
          >
            <option value="all">Todos los estados</option>
            <option value="approved">Aprobados</option>
            <option value="pending">Pendientes</option>
            <option value="rejected">Rechazados</option>
          </select>
          <button
            onClick={exportToCSV}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Exportar
          </button>
        </div>
      </div>

      {/* Lista de ingresos */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Descripción
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Comprador
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Monto
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {ingresosFiltrados.map((ingreso) => (
                <tr key={ingreso.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900 font-medium">
                      {format(new Date(ingreso.fecha), 'dd/MM/yyyy')}
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(ingreso.fecha), 'HH:mm')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900 font-medium">
                      {ingreso.descripcion || 'Pago recibido'}
                    </div>
                    <div className="text-xs text-slate-500">
                      ID: {ingreso.mercadopago_id.slice(0, 15)}...
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900">
                      {ingreso.comprador_email || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-lg font-bold text-green-700">
                      ${Number(ingreso.monto).toLocaleString('es-UY')} {ingreso.moneda || 'UYU'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${
                      ingreso.estado === 'approved' ? 'badge-success' :
                      ingreso.estado === 'pending' ? 'badge-warning' :
                      'badge-error'
                    }`}>
                      {ingreso.estado === 'approved' ? 'Aprobado' :
                       ingreso.estado === 'pending' ? 'Pendiente' :
                       'Rechazado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => eliminarIngreso(ingreso.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Eliminar ingreso"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {ingresosFiltrados.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              {searchTerm || filterEstado !== 'all' 
                ? 'No se encontraron ingresos con los filtros seleccionados'
                : 'No hay ingresos registrados. Sincroniza con MercadoPago para importar pagos.'}
            </div>
          )}
        </div>
      </div>

      {/* Modal para crear/editar ingreso */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="card p-8 max-w-2xl w-full animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6 sticky top-0 bg-white pb-4 -mx-8 px-8">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingIngreso ? 'Editar Ingreso' : 'Nuevo Ingreso'}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="1000.00"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Moneda *
                  </label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="moneda"
                        value="UYU"
                        checked={formData.moneda === 'UYU'}
                        onChange={(e) => setFormData({ ...formData, moneda: e.target.value as Moneda })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-medium text-slate-700">🪙 Pesos</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="moneda"
                        value="USD"
                        checked={formData.moneda === 'USD'}
                        onChange={(e) => setFormData({ ...formData, moneda: e.target.value as Moneda })}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-medium text-slate-700">💵 Dólares</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Categoría *
                </label>
                <select
                  value={formData.categoria_id}
                  onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                  className="input-field"
                  required
                >
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </option>
                  ))}
                </select>
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
                  placeholder="Venta de libros"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    Email (opcional)
                  </label>
                  <input
                    type="email"
                    value={formData.comprador_email}
                    onChange={(e) => setFormData({ ...formData, comprador_email: e.target.value })}
                    className="input-field"
                    placeholder="cliente@example.com"
                  />
                </div>
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
                  {editingIngreso ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
