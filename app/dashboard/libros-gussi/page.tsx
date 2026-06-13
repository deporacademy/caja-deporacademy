'use client'

import { useState } from 'react'
import { BookOpen, Plus, Trash2, Download } from 'lucide-react'
import { format } from 'date-fns'

interface LibroGussi {
  id: string
  titulo: string
  precioPublico: number
  precioGussi: number
  fecha: string
  mes: number
  año: number
}

export default function LibrosGussiPage() {
  const [libros, setLibros] = useState<LibroGussi[]>([])
  const [formLibro, setFormLibro] = useState({
    titulo: '',
    precioPublico: '',
    fecha: format(new Date(), 'yyyy-MM-dd')
  })

  const descuentoGussi = 0.35 // 35%

  const agregarLibro = () => {
    if (!formLibro.titulo || !formLibro.precioPublico) {
      alert('Completa todos los campos')
      return
    }

    const precioPublico = parseFloat(formLibro.precioPublico)
    const precioGussi = precioPublico * (1 - descuentoGussi)
    const fecha = new Date(formLibro.fecha)

    const nuevoLibro: LibroGussi = {
      id: Date.now().toString(),
      titulo: formLibro.titulo,
      precioPublico,
      precioGussi,
      fecha: formLibro.fecha,
      mes: fecha.getMonth() + 1,
      año: fecha.getFullYear()
    }

    setLibros([...libros, nuevoLibro])
    setFormLibro({
      titulo: '',
      precioPublico: '',
      fecha: format(new Date(), 'yyyy-MM-dd')
    })
  }

  const eliminarLibro = (id: string) => {
    setLibros(libros.filter(l => l.id !== id))
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
    acc[key].totalPublico += libro.precioPublico
    acc[key].totalGussi += libro.precioGussi
    acc[key].descuentoTotal += libro.precioPublico - libro.precioGussi
    return acc
  }, {} as Record<string, any>)

  const mesesOrdenados = Object.values(librosAgrupados).sort((a, b) => {
    if (a.año !== b.año) return b.año - a.año
    return b.mes - a.mes
  })

  const totalGeneral = libros.reduce((sum, l) => sum + l.precioPublico, 0)
  const totalGussiGeneral = libros.reduce((sum, l) => sum + l.precioGussi, 0)
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
        <div className="space-y-6">
          {mesesOrdenados.map((grupo) => (
            <div key={`${grupo.mes}-${grupo.año}`} className="card p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">
                📚 {meses[grupo.mes]} {grupo.año}
              </h2>

              {/* Subtotales del mes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-slate-50 rounded-lg">
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
                    {grupo.libros.map((libro) => (
                      <tr key={libro.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{libro.titulo}</td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {format(new Date(libro.fecha), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          ${libro.precioPublico.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right text-green-700 font-semibold">
                          ${(libro.precioPublico - libro.precioGussi).toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-bold bg-blue-50 text-blue-700">
                          ${libro.precioGussi.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
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
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center text-slate-400">
          <p>No hay libros registrados. Agrega tu primer libro para empezar.</p>
        </div>
      )}
    </div>
  )
}
