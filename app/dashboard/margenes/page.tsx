'use client'

import { useState } from 'react'
import { DollarSign, Settings, Plus, Trash2, Edit2 } from 'lucide-react'

interface Parametros {
  tipoCambio: number
  comisionMP: number
  financiacion: number
  iva: number
}

interface Libro {
  id: string
  titulo: string
  precioUSD: number
  precioVenta: number
  proveedor: 'librofutbol' | 'gussi'
}

export default function MargenesPage() {
  const [parametros, setParametros] = useState<Parametros>({
    tipoCambio: 39.9,
    comisionMP: 5.99,
    financiacion: 2.49,
    iva: 22
  })

  const [libros, setLibros] = useState<Libro[]>([
    {
      id: '1',
      titulo: 'Harry Potter 1',
      precioUSD: 15.99,
      precioVenta: 1200,
      proveedor: 'librofutbol'
    },
    {
      id: '2',
      titulo: 'El Nombre del Viento',
      precioUSD: 18.5,
      precioVenta: 1450,
      proveedor: 'librofutbol'
    },
    {
      id: '4',
      titulo: 'Libro Gussi 1',
      precioUSD: 0,
      precioVenta: 950,
      proveedor: 'gussi'
    }
  ])

  const [editando, setEditando] = useState(false)
  const [paramTemp, setParamTemp] = useState<Parametros>(parametros)
  const [formLibro, setFormLibro] = useState({ titulo: '', precioUSD: '', precioVenta: '', proveedor: 'librofutbol' })

  interface CalculoMargen {
    precioBase: number
    descuentoAplicado: number
    precioConDescuento: number
    precioConvertido: number
    costoEnvio: number
    precioConEnvio: number
    ganancia: number
    margenContado: number
    comisionMPCalc: number
    ivaComision: number
    tasaFinanCalc: number
    ivaFinan: number
    totalMP: number
    gananciaFinal: number
  }

  const calcularMargen = (libro: Libro): CalculoMargen => {
    if (libro.proveedor === 'librofutbol') {
      // LIBROFUTBOL (en dólares) - 30% descuento
      const precioBase = libro.precioUSD
      const descuentoAplicado = 0.30 // 30%
      const precioConDescuento = precioBase * (1 - descuentoAplicado)
      const precioConvertido = precioConDescuento * parametros.tipoCambio
      
      // ENVÍO: precio convertido + (dólar * 4)
      const costoEnvio = precioConvertido + (parametros.tipoCambio * 4)
      const precioConEnvio = precioConvertido + costoEnvio
      
      const ganancia = libro.precioVenta - precioConEnvio
      const margenContado = (ganancia * 100) / precioConEnvio

      const comisionMPCalc = libro.precioVenta * (-parametros.comisionMP / 100)
      const ivaComision = comisionMPCalc * (parametros.iva / 100)
      const tasaFinanCalc = libro.precioVenta * (-parametros.financiacion / 100)
      const ivaFinan = tasaFinanCalc * (parametros.iva / 100)
      const totalMP = comisionMPCalc + ivaComision + tasaFinanCalc + ivaFinan
      const gananciaFinal = ganancia + totalMP

      return {
        precioBase,
        descuentoAplicado,
        precioConDescuento,
        precioConvertido,
        costoEnvio,
        precioConEnvio,
        ganancia,
        margenContado,
        comisionMPCalc,
        ivaComision,
        tasaFinanCalc,
        ivaFinan,
        totalMP,
        gananciaFinal
      }
    } else {
      // GUSSI (en pesos) - 35% descuento
      const precioBase = libro.precioVenta
      const descuentoAplicado = 0.35 // 35%
      const precioConDescuento = precioBase * (1 - descuentoAplicado)
      const ganancia = precioBase - precioConDescuento
      const margenContado = (ganancia * 100) / precioConDescuento

      const comisionMPCalc = libro.precioVenta * (-parametros.comisionMP / 100)
      const ivaComision = comisionMPCalc * (parametros.iva / 100)
      const tasaFinanCalc = libro.precioVenta * (-parametros.financiacion / 100)
      const ivaFinan = tasaFinanCalc * (parametros.iva / 100)
      const totalMP = comisionMPCalc + ivaComision + tasaFinanCalc + ivaFinan
      const gananciaFinal = ganancia + totalMP

      return {
        precioBase,
        descuentoAplicado,
        precioConDescuento,
        precioConvertido: 0,
        costoEnvio: 0,
        precioConEnvio: precioConDescuento,
        ganancia,
        margenContado,
        comisionMPCalc,
        ivaComision,
        tasaFinanCalc,
        ivaFinan,
        totalMP,
        gananciaFinal
      }
    }
  }

  const agregarLibro = () => {
    if (!formLibro.titulo || !formLibro.precioVenta) {
      alert('Completa Título y Precio de Venta')
      return
    }

    const nuevoLibro: Libro = {
      id: Date.now().toString(),
      titulo: formLibro.titulo,
      precioUSD: formLibro.proveedor === 'librofutbol' ? parseFloat(formLibro.precioUSD) : 0,
      precioVenta: parseFloat(formLibro.precioVenta),
      proveedor: formLibro.proveedor as 'librofutbol' | 'gussi'
    }

    setLibros([...libros, nuevoLibro])
    setFormLibro({ titulo: '', precioUSD: '', precioVenta: '', proveedor: 'librofutbol' })
  }

  const eliminarLibro = (id: string) => {
    setLibros(libros.filter(l => l.id !== id))
  }

  const guardarParametros = () => {
    setParametros(paramTemp)
    setEditando(false)
  }

  const librofutbolLibros = libros.filter(l => l.proveedor === 'librofutbol')
  const gussiLibros = libros.filter(l => l.proveedor === 'gussi')

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-emerald-600" />
            Calculadora de Márgenes
          </h1>
          <p className="text-slate-600">Visualiza márgenes de ganancias de todos tus libros</p>
        </div>
        <button
          onClick={() => {
            setEditando(!editando)
            setParamTemp(parametros)
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Settings className="w-5 h-5" />
          {editando ? 'Cancelar' : 'Parámetros'}
        </button>
      </div>

      {/* Panel de Parámetros */}
      {editando && (
        <div className="card p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Configuración de Parámetros</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tipo de Cambio (USD → $)
              </label>
              <input
                type="number"
                step="0.1"
                value={paramTemp.tipoCambio}
                onChange={(e) => setParamTemp({ ...paramTemp, tipoCambio: parseFloat(e.target.value) })}
                className="input-field w-full"
              />
              <p className="text-xs text-slate-500 mt-1">Precio actual: ${paramTemp.tipoCambio.toFixed(2)}</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Comisión MercadoPago (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={paramTemp.comisionMP}
                onChange={(e) => setParamTemp({ ...paramTemp, comisionMP: parseFloat(e.target.value) })}
                className="input-field w-full"
              />
              <p className="text-xs text-slate-500 mt-1">{paramTemp.comisionMP.toFixed(2)}% de comisión</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tasa Financiación (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={paramTemp.financiacion}
                onChange={(e) => setParamTemp({ ...paramTemp, financiacion: parseFloat(e.target.value) })}
                className="input-field w-full"
              />
              <p className="text-xs text-slate-500 mt-1">{paramTemp.financiacion.toFixed(2)}% de financiación</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                IVA (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={paramTemp.iva}
                onChange={(e) => setParamTemp({ ...paramTemp, iva: parseFloat(e.target.value) })}
                className="input-field w-full"
              />
              <p className="text-xs text-slate-500 mt-1">{paramTemp.iva.toFixed(2)}% IVA</p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={guardarParametros}
              className="btn-primary"
            >
              Guardar Parámetros
            </button>
            <button
              onClick={() => setEditando(false)}
              className="btn-secondary"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Panel Agregar Libros */}
      <div className="card p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Agregar Nuevo Libro</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Proveedor</label>
            <select
              value={formLibro.proveedor}
              onChange={(e) => setFormLibro({ ...formLibro, proveedor: e.target.value })}
              className="input-field w-full"
            >
              <option value="librofutbol">LibroFutbol (ARG)</option>
              <option value="gussi">Gussi (UY)</option>
            </select>
          </div>

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

          {formLibro.proveedor === 'librofutbol' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">U$S</label>
              <input
                type="number"
                step="0.01"
                placeholder="Precio USD"
                value={formLibro.precioUSD}
                onChange={(e) => setFormLibro({ ...formLibro, precioUSD: e.target.value })}
                className="input-field w-full"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Venta ($)</label>
            <input
              type="number"
              step="1"
              placeholder="Precio venta"
              value={formLibro.precioVenta}
              onChange={(e) => setFormLibro({ ...formLibro, precioVenta: e.target.value })}
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

      {/* LibroFutbol */}
      {librofutbolLibros.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            📘 LibroFutbol (Argentina) - {librofutbolLibros.length} libros
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Título</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">U$S</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Desc. 30%</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">U$S Final</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">$ Convertido</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Envío</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Total Costo</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Venta</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Ganancia</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Margen %</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">MP Total</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 bg-emerald-50">
                    Ganancia Final
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {librofutbolLibros.map((libro) => {
                  const calculo = calcularMargen(libro)
                  return (
                    <tr key={libro.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{libro.titulo}</td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        ${calculo.precioBase.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        ${(calculo.precioBase * calculo.descuentoAplicado).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        ${calculo.precioConDescuento.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        ${calculo.precioConvertido.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        ${calculo.costoEnvio.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        ${calculo.precioConEnvio.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        ${libro.precioVenta.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${calculo.ganancia >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        ${calculo.ganancia.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${calculo.margenContado >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {calculo.margenContado.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        ${calculo.totalMP.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold bg-emerald-50 ${calculo.gananciaFinal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        ${calculo.gananciaFinal.toFixed(2)}
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
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gussi */}
      {gussiLibros.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            📗 Gussi (Uruguay) - {gussiLibros.length} libros
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">Título</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Venta</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Desc. 35%</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Costo</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Ganancia</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">Margen %</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700">MP Total</th>
                  <th className="px-4 py-3 text-right font-semibold text-slate-700 bg-blue-50">
                    Ganancia Final
                  </th>
                  <th className="px-4 py-3 text-center font-semibold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {gussiLibros.map((libro) => {
                  const calculo = calcularMargen(libro)
                  return (
                    <tr key={libro.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">{libro.titulo}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        ${libro.precioVenta.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        ${(libro.precioVenta * calculo.descuentoAplicado).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        ${calculo.precioConDescuento.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${calculo.ganancia >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        ${calculo.ganancia.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${calculo.margenContado >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {calculo.margenContado.toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        ${calculo.totalMP.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 text-right font-bold bg-blue-50 ${calculo.gananciaFinal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        ${calculo.gananciaFinal.toFixed(2)}
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
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {libros.length === 0 && (
        <div className="card p-12 text-center text-slate-400">
          <p>No hay libros agregados. Agrega tu primer libro para empezar.</p>
        </div>
      )}
    </div>
  )
}

