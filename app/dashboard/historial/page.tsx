'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths, parse } from 'date-fns'
import { es } from 'date-fns/locale'

type ResumenMensual = {
  mes: string
  mesNum: number
  año: number
  ingresoUSD: number
  gastoUSD: number
  balanceUSD: number
  ingresoUYU: number
  gastoUYU: number
  balanceUYU: number
}

export default function HistorialPage() {
  const [resumen, setResumen] = useState<ResumenMensual[]>([])
  const [loading, setLoading] = useState(true)
  const [mesesMostrar] = useState(12)

  useEffect(() => {
    cargarHistorial()
  }, [])

  async function cargarHistorial() {
    try {
      const mesesData: ResumenMensual[] = []

      for (let i = 0; i < mesesMostrar; i++) {
        const fecha = subMonths(new Date(), i)
        const inicioMes = startOfMonth(fecha)
        const finMes = endOfMonth(fecha)

        // Ingresos USD
        const { data: ingresosUSDData } = await supabase
          .from('ingresos')
          .select('monto')
          .gte('fecha', inicioMes.toISOString())
          .lte('fecha', finMes.toISOString())
          .eq('estado', 'approved')
          .eq('moneda', 'USD')

        // Ingresos UYU
        const { data: ingresosUYUData } = await supabase
          .from('ingresos')
          .select('monto')
          .gte('fecha', inicioMes.toISOString())
          .lte('fecha', finMes.toISOString())
          .eq('estado', 'approved')
          .or('moneda.is.null,moneda.eq.UYU')

        // Gastos USD
        const { data: gastosUSDData } = await supabase
          .from('gastos')
          .select('monto')
          .gte('fecha', inicioMes.toISOString())
          .lte('fecha', finMes.toISOString())
          .eq('moneda', 'USD')

        // Gastos UYU
        const { data: gastosUYUData } = await supabase
          .from('gastos')
          .select('monto')
          .gte('fecha', inicioMes.toISOString())
          .lte('fecha', finMes.toISOString())
          .or('moneda.is.null,moneda.eq.UYU')

        const ingresoUSD = ingresosUSDData?.reduce((sum, i) => sum + Number(i.monto), 0) || 0
        const ingresoUYU = ingresosUYUData?.reduce((sum, i) => sum + Number(i.monto), 0) || 0
        const gastoUSD = gastosUSDData?.reduce((sum, g) => sum + Number(g.monto), 0) || 0
        const gastoUYU = gastosUYUData?.reduce((sum, g) => sum + Number(g.monto), 0) || 0

        mesesData.push({
          mes: format(fecha, 'MMMM', { locale: es }),
          mesNum: fecha.getMonth() + 1,
          año: fecha.getFullYear(),
          ingresoUSD,
          gastoUSD,
          balanceUSD: ingresoUSD - gastoUSD,
          ingresoUYU,
          gastoUYU,
          balanceUYU: ingresoUYU - gastoUYU
        })
      }

      setResumen(mesesData)
    } catch (error) {
      console.error('Error cargando historial:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Totales USD
  const totalIngresoUSD = resumen.reduce((sum, m) => sum + m.ingresoUSD, 0)
  const totalGastoUSD = resumen.reduce((sum, m) => sum + m.gastoUSD, 0)
  const balanceTotalUSD = totalIngresoUSD - totalGastoUSD

  // Totales UYU
  const totalIngresoUYU = resumen.reduce((sum, m) => sum + m.ingresoUYU, 0)
  const totalGastoUYU = resumen.reduce((sum, m) => sum + m.gastoUYU, 0)
  const balanceTotalUYU = totalIngresoUYU - totalGastoUYU

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Calendar className="w-8 h-8 text-primary-600" />
          Historial Mensual
        </h1>
        <p className="text-gray-600 mt-2">
          Resumen de ingresos y gastos de los últimos {mesesMostrar} meses
        </p>
      </div>

      {/* DÓLARES USD */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          💵 Dólares Estadounidenses (USD)
        </h2>

        {/* Totales USD */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Ingresos USD</h3>
                <p className="text-3xl font-bold text-green-700">
                  U${totalIngresoUSD.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="stat-card bg-gradient-to-br from-red-50 to-rose-50 border-red-200/60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Gastos USD</h3>
                <p className="text-3xl font-bold text-red-700">
                  U${totalGastoUSD.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingDown className="w-10 h-10 text-red-600 opacity-50" />
            </div>
          </div>

          <div className={`stat-card bg-gradient-to-br ${
            balanceTotalUSD >= 0 
              ? 'from-blue-50 to-indigo-50 border-blue-200/60' 
              : 'from-amber-50 to-orange-50 border-amber-200/60'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Balance USD</h3>
                <p className={`text-3xl font-bold ${balanceTotalUSD >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                  U${balanceTotalUSD.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className={`w-10 h-10 opacity-50 ${balanceTotalUSD >= 0 ? 'text-blue-600' : 'text-amber-600'}`} />
            </div>
          </div>
        </div>

        {/* Tabla USD */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Ingresos USD
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Gastos USD
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Balance USD
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {resumen.map((mes, index) => (
                  <tr key={`usd-${index}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 capitalize">
                        {mes.mes} {mes.año}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-green-700 font-semibold">
                        U${mes.ingresoUSD.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-red-700 font-semibold">
                        U${mes.gastoUSD.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${mes.balanceUSD >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                        U${mes.balanceUSD.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {resumen.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No hay datos de historial disponibles
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PESOS UYU */}
      <div className="space-y-4 mt-8">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          🇺🇾 Pesos Uruguayos (UYU)
        </h2>

        {/* Totales UYU */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Ingresos UYU</h3>
                <p className="text-3xl font-bold text-green-700">
                  ${totalIngresoUYU.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="stat-card bg-gradient-to-br from-red-50 to-rose-50 border-red-200/60">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Gastos UYU</h3>
                <p className="text-3xl font-bold text-red-700">
                  ${totalGastoUYU.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingDown className="w-10 h-10 text-red-600 opacity-50" />
            </div>
          </div>

          <div className={`stat-card bg-gradient-to-br ${
            balanceTotalUYU >= 0 
              ? 'from-blue-50 to-indigo-50 border-blue-200/60' 
              : 'from-amber-50 to-orange-50 border-amber-200/60'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Balance UYU</h3>
                <p className={`text-3xl font-bold ${balanceTotalUYU >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                  ${balanceTotalUYU.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <DollarSign className={`w-10 h-10 opacity-50 ${balanceTotalUYU >= 0 ? 'text-blue-600' : 'text-amber-600'}`} />
            </div>
          </div>
        </div>

        {/* Tabla UYU */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Ingresos UYU
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Gastos UYU
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Balance UYU
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {resumen.map((mes, index) => (
                  <tr key={`uyu-${index}`} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 capitalize">
                        {mes.mes} {mes.año}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-green-700 font-semibold">
                        ${mes.ingresoUYU.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-red-700 font-semibold">
                        ${mes.gastoUYU.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${mes.balanceUYU >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                        ${mes.balanceUYU.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {resumen.length === 0 && (
              <div className="text-center py-12 text-slate-400">
                No hay datos de historial disponibles
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
