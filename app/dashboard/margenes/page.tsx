'use client'

import { useState } from 'react'
import { DollarSign, Settings, Download } from 'lucide-react'

interface Parametros {
  tipoCambio: number
  comisionMP: number
  financiacion: number
  iva: number
  costoEnvio: number
}

interface Libro {
  id: string
  titulo: string
  precioUSD: number
  descuento: number
  precioVenta: number
  proveedor: 'librofutbol' | 'gussi'
}

// Datos de ejemplo - después se pueden conectar a la BD
const librosData: Libro[] = [
  {
    id: '1',
    titulo: 'Harry Potter 1',
    precioUSD: 15.99,
    descuento: 0.3,
    precioVenta: 1200,
    proveedor: 'librofutbol'
  },
  {
    id: '2',
    titulo: 'El Nombre del Viento',
    precioUSD: 18.5,
    descuento: 0.3,
    precioVenta: 1450,
    proveedor: 'librofutbol'
  },
  {
    id: '3',
    titulo: 'Cien Años de Soledad',
    precioUSD: 16.99,
    descuento: 0.3,
    precioVenta: 1350,
    proveedor: 'librofutbol'
  },
  {
    id: '4',
    titulo: 'Libro Gussi 1',
    precioUSD: 0,
    descuento: 0.2,
    precioVenta: 950,
    proveedor: 'gussi'
  },
  {
    id: '5',
    titulo: 'Libro Gussi 2',
    precioUSD: 0,
    descuento: 0.2,
    precioVenta: 1100,
    proveedor: 'gussi'
  }
]

interface CalculoMargen {
  precioBase: number
  precioDescuento: number
  precioConvertido: number
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

export default function MargenesPage() {
  const [parametros, setParametros] = useState<Parametros>({
    tipoCambio: 39.9,
    comisionMP: 5.99,
    financiacion: 2.49,
    iva: 22,
    costoEnvio: 173.10 // 41 * 4.2368
  })

  const [editando, setEditando] = useState(false)
  const [paramTemp, setParamTemp] = useState<Parametros>(parametros)

  const calcularMargen = (libro: Libro): CalculoMargen => {
    if (libro.proveedor === 'librofutbol') {
      // LIBROFUTBOL (en dólares)
      const precioBase = libro.precioUSD
      const precioDescuento = precioBase * (1 - libro.descuento)
      const precioConvertido = precioDescuento * parametros.tipoCambio
      const precioConEnvio = precioConvertido + parametros.costoEnvio
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
        precioDescuento,
        precioConvertido,
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
      // GUSSI (en pesos)
      const precioBase = libro.descuento > 0 ? libro.precioVenta / (1 - libro.descuento) : libro.precioVenta
      const precioDescuento = precioBase * (1 - libro.descuento)
      const ganancia = libro.precioVenta - precioDescuento
      const margenContado = (ganancia * 100) / precioDescuento

      const comisionMPCalc = libro.precioVenta * (-parametros.comisionMP / 100)
      const ivaComision = comisionMPCalc * (parametros.iva / 100)
      const tasaFinanCalc = libro.precioVenta * (-parametros.financiacion / 100)
      const ivaFinan = tasaFinanCalc * (parametros.iva / 100)
      const totalMP = comisionMPCalc + ivaComision + tasaFinanCalc + ivaFinan
      const gananciaFinal = ganancia + totalMP

      return {
        precioBase: precioDescuento,
        precioDescuento: precioDescuento,
        precioConvertido: precioDescuento,
        precioConEnvio: precioDescuento,
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

  const guardarParametros = () => {
    setParametros(paramTemp)
    setEditando(false)
  }

  const librofutbolLibros = librosData.filter(l => l.proveedor === 'librofutbol')
  const gussiLibros = librosData.filter(l => l.proveedor === 'gussi')

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Costo de Envío ($)
              </label>
              <input
                type="number"
                step="1"
                value={paramTemp.costoEnvio}
                onChange={(e) => setParamTemp({ ...paramTemp, costoEnvio: parseFloat(e.target.value) })}
                className="input-field w-full"
              />
              <p className="text-xs text-slate-500 mt-1">${paramTemp.costoEnvio.toFixed(2)} por envío</p>
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

      {/* LibroFutbol */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          📘 LibroFutbol (Argentina)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Título</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">U$S</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Desc.</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">U$S Final</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">$</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">+Envío</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Venta</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Ganancia</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Margen %</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">MP Total</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 bg-emerald-50">
                  Ganancia Final
                </th>
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
                      {(libro.descuento * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      ${calculo.precioDescuento.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      ${calculo.precioConvertido.toFixed(2)}
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gussi */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
          📗 Gussi (Uruguay)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700">Título</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Costo</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Desc.</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Precio Base</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Venta</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Ganancia</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">Margen %</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700">MP Total</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-700 bg-blue-50">
                  Ganancia Final
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {gussiLibros.map((libro) => {
                const calculo = calcularMargen(libro)
                return (
                  <tr key={libro.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{libro.titulo}</td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      ${calculo.precioDescuento.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      {(libro.descuento * 100).toFixed(0)}%
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">
                      ${calculo.precioDescuento.toFixed(2)}
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
                    <td className={`px-4 py-3 text-right font-bold bg-blue-50 ${calculo.gananciaFinal >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      ${calculo.gananciaFinal.toFixed(2)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
