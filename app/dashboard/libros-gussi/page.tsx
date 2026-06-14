'use client'

import { useState, useEffect } from 'react'
import { BookOpen, Plus, Trash2 } from 'lucide-react'
import { format, parse } from 'date-fns'
import { supabase } from '@/lib/supabase'

interface LibroGussi {
  id: string
  titulo: string
  precio_publico: number
  precio_gussi: number
  fecha: string
  mes: number
  año: number
}

export default function LibrosGussiPage() {
  const [libros, setLibros] = useState<LibroGussi[]>([])
  const [expandedMeses, setExpandedMeses] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [formLibro, setFormLibro] = useState({
    titulo: '',
    precioPublico: '',
    fecha: format(new Date(), 'yyyy-MM-dd')
  })

  const descuentoGussi = 0.35 // 35%
  
  // Determinar el mes actual
  const mesActual = new Date()
  const mesActualKey = `${mesActual.getMonth() + 1}/${mesActual.getFullYear()}`

  // Cargar libros desde Supabase
  useEffect(() => {
    cargarLibros()
    setExpandedMeses(new Set([mesActualKey]))
  }, [])

  async function cargarLibros() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('libros_gussi')
        .select('*')
        .order('fecha', { ascending: false })

      if (error) throw error
      setLibros(data || [])
    } catch (error) {
      console.error('Error cargando libros:', error)
    } finally {
      setLoading(false)
    }
  }

  const agregarLibro = async () => {
    if (!formLibro.titulo || !formLibro.precioPublico) {
      alert('Completa todos los campos')
      return
    }

    const precioPublico = parseFloat(formLibro.precioPublico)
    const precioGussi = precioPublico * (1 - descuentoGussi)
    const fecha = parse(formLibro.fecha, 'yyyy-MM-dd', new Date())

    try {
      const { data, error } = await supabase
        .from('libros_gussi')
        .insert({
          titulo: formLibro.titulo,
          precio_publico: precioPublico,
          precio_gussi: precioGussi,
          fecha: formLibro.fecha,
          mes: fecha.getMonth() + 1,
          año: fecha.getFullYear()
        })
        .select()

      if (error) throw error

      setLibros([...libros, ...(data || [])])
      setFormLibro({
        titulo: '',
        precioPublico: '',
        fecha: format(new Date(), 'yyyy-MM-dd')
      })
    } catch (error) {
      console.error('Error agregando libro:', error)
      alert('Error al agregar el libro')
    }
  }

  const eliminarLibro = async (id: string) => {
    try {
      const { error } = await supabase
        .from('libros_gussi')
        .delete()
        .eq('id', id)

      if (error) throw error

      setLibros(libros.filter(l => l.id !== id))
    } catch (error) {
      console.error('Error eliminando libro:', error)
      alert('Error al eliminar el libro')
    }
  }

  const toggleMes = (mesKey: string) => {
    const newExpandedMeses = new Set(expandedMeses)
    if (newExpandedMeses.has(mesKey)) {
      newExpandedMeses.delete(mesKey)
    } else {
      newExpandedMeses.add(mesKey)
    }
    setExpandedMeses(newExpandedMeses)
  }

  // Agrupar por mes-año
  const librosAgrupados = libros.reduce((acc, libro) => {
    const key = `${libro.mes}/${libro.año}`
    if (!acc[key]) {
      acc[key] = {
        mes: libro.mes,
        año: libro.año,
        libros: [],
        totalPublico: 0,
        totalGussi: 0,
        descuentoTotal: 0
      }
    }
    acc[key].libros.push(libro)
    acc[key].totalPublico += libro.precio_publico
    acc[key].totalGussi += libro.precio_gussi
    acc[key].descuentoTotal += libro.precio_publico - libro.precio_gussi
    return acc
  }, {} as Record<string, any>)

  const mesesOrdenados = Object.values(librosAgrupados).sort((a, b) => {
    if (a.año !== b.año) return b.año - a.año
    return b.mes - a.mes
  })

  const totalGeneral = libros.reduce((sum, l) => sum + l.precio_publico, 0)
  const totalGussiGeneral = libros.reduce((sum, l) => sum + l.precio_gussi, 0)
  const descuentoGeneral = totalGeneral - totalGussiGeneral

  const meses = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                 'Julio', 'Agosto', 'Setiembre', 'Octubre', 'Noviembre', 'Diciembre']

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-blue-600" />
          Libros Gussi
        </h1>
        <p className="text-slate-600">Registra libros vendidos de la distribuidora Gussi (35% descuento)</p>
      </div>

      {/* Formulario */}
      <div className="card p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Agregar Nuevo Libro</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Título</label>
            <input
              type="text"
              placeholder="Nombre del libro"
              value={formLibro.titulo}
              onChange={(e) => setFormLibro({ ...formLibro, titulo: e.target.value })}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Precio Público ($)</label>
            <input
              type="number"
              step="0.01"
              placeholder="Precio venta"
              value={formLibro.precioPublico}
              onChange={(e) => setFormLibro({ ...formLibro, precioPublico: e.target.value })}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Fecha</label>
            <input
              type="date"
              value={formLibro.fecha}
              onChange={(e) => setFormLibro({ ...formLibro, fecha: e.target.value })}
              className="input-field w-full"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={agregarLibro}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Agregar
            </button>
          </div>
        </div>
      </div>

      {/* Totales Generales */}
      {libros.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Precio Público Total</h3>
                <p className="text-3xl font-bold text-amber-700">
                  ${totalGeneral.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">A Pagar a Gussi (65%)</h3>
                <p className="text-3xl font-bold text-blue-700">
                  ${totalGussiGeneral.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Descuento Gussi (35%)</h3>
                <p className="text-3xl font-bold text-green-700">
                  ${descuentoGeneral.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Libros por Mes */}
      {mesesOrdenados.length > 0 ? (
        <div className="space-y-4">
          {mesesOrdenados.map((grupo) => {
            const mesKey = `${grupo.mes}/${grupo.año}`
            const isCurrentMes = mesKey === mesActualKey
            const isExpanded = expandedMeses.has(mesKey)

            return (
              <div key={mesKey} className={`card overflow-hidden ${isCurrentMes ? 'border-blue-300 border-2' : ''}`}>
                {/* Header Deplegable */}
                <button
                  onClick={() => toggleMes(mesKey)}
                  className="w-full p-6 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <h2 className={`text-xl font-bold ${isCurrentMes ? 'text-blue-700' : 'text-slate-900'}`}>
                      📚 {meses[grupo.mes]} {grupo.año}
                      {isCurrentMes && <span className="ml-2 text-sm text-blue-600 font-semibold">(Mes Actual)</span>}
                    </h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-slate-600">
                      {grupo.libros.length} libro{grupo.libros.length !== 1 ? 's' : ''}
                    </span>
                    <svg
                      className={`w-5 h-5 text-slate-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </button>

                {/* Contenido Deplegable */}
                {isExpanded && (
                  <>
                    {/* Subtotales del mes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 bg-slate-50 border-t border-slate-200">
                      <div>
                        <p className="text-sm text-slate-600">Precio Público</p>
                        <p className="text-xl font-bold text-slate-900">
                          ${grupo.totalPublico.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">A Pagar a Gussi</p>
                        <p className="text-xl font-bold text-blue-700">
                          ${grupo.totalGussi.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Descuento (35%)</p>
                        <p className="text-xl font-bold text-green-700">
                          ${grupo.descuentoTotal.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    {/* Tabla de libros */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-100 border-b border-slate-200">
                          <tr>
                            <th className="px-4 py-3 text-left font-semibold text-slate-700">Título</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-700">Fecha</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-700">Precio Público</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-700">Descuento (35%)</th>
                            <th className="px-4 py-3 text-right font-semibold text-slate-700 bg-blue-50">A Pagar Gussi</th>
                            <th className="px-4 py-3 text-center font-semibold text-slate-700">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {grupo.libros.map((libro: LibroGussi) => (
                            <tr key={libro.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-4 py-3 font-medium text-slate-900">{libro.titulo}</td>
                              <td className="px-4 py-3 text-right text-slate-600">
                                {format(new Date(libro.fecha), 'dd/MM/yyyy')}
                              </td>
                              <td className="px-4 py-3 text-right text-slate-600">
                                ${libro.precio_publico.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-right text-green-700 font-semibold">
                                ${(libro.precio_publico - libro.precio_gussi).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-right font-bold bg-blue-50 text-blue-700">
                                ${libro.precio_gussi.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => eliminarLibro(libro.id)}
                                  className="text-red-600 hover:text-red-800 p-1"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-12 text-center text-slate-400">
          <p>No hay libros registrados. Agrega tu primer libro para empezar.</p>
        </div>
      )}
    </div>
  )
}
