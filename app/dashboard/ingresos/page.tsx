'use client'

import { useEffect, useState } from 'react'
import { supabase, type Ingreso } from '@/lib/supabase'
import { TrendingUp, RefreshCw, Search, Download } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export default function IngresosPage() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('all')

  useEffect(() => {
    loadIngresos()
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

  async function syncMercadoPago() {
    setSyncing(true)
    try {
      const response = await fetch('/api/sync-mercadopago')
      const result = await response.json()
      
      if (response.ok) {
        alert(`Sincronización completada: ${result.nuevos} nuevos ingresos`)
        loadIngresos()
      } else {
        alert('Error al sincronizar: ' + result.error)
      }
    } catch (error) {
      alert('Error al sincronizar con MercadoPago')
    } finally {
      setSyncing(false)
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
          onClick={syncMercadoPago}
          disabled={syncing}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar MP'}
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
                      ${Number(ingreso.monto).toLocaleString('es-UY')}
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
    </div>
  )
}
