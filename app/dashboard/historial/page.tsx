'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { es } from 'date-fns/locale'

type ResumenMensual = {
  mes: string
  mesNum: number
  año: number
  ingresos: number
  gastos: number
  balance: number
}

export default function HistorialPage() {
  const [resumen, setResumen] = useState<ResumenMensual[]>([])
  const [loading, setLoading] = useState(true)
  const [mesesMostrar] = useState(12) // Mostrar últimos 12 meses

  useEffect(() => {
    cargarHistorial()
  }, [])

  async function cargarHistorial() {
    try {
      const mesesData: ResumenMensual[] = []

      // Generar últimos 12 meses
      for (let i = 0; i < mesesMostrar; i++) {
        const fecha = subMonths(new Date(), i)
        const inicioMes = startOfMonth(fecha)
        const finMes = endOfMonth(fecha)

        // Obtener ingresos del mes
        const { data: ingresosData } = await supabase
          .from('ingresos')
          .select('monto')
          .gte('fecha', inicioMes.toISOString())
          .lte('fecha', finMes.toISOString())
          .eq('estado', 'approved')

        // Obtener gastos del mes
        const { data: gastosData } = await supabase
          .from('gastos')
          .select('monto')
          .gte('fecha', inicioMes.toISOString())
          .lte('fecha', finMes.toISOString())

        const totalIngresos = ingresosData?.reduce((sum, i) => sum + Number(i.monto), 0) || 0
        const totalGastos = gastosData?.reduce((sum, g) => sum + Number(g.monto), 0) || 0

        mesesData.push({
          mes: format(fecha, 'MMMM', { locale: es }),
          mesNum: fecha.getMonth() + 1,
          año: fecha.getFullYear(),
          ingresos: totalIngresos,
          gastos: totalGastos,
          balance: totalIngresos - totalGastos
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

  const totalIngresos = resumen.reduce((sum, m) => sum + m.ingresos, 0)
  const totalGastos = resumen.reduce((sum, m) => sum + m.gastos, 0)
  const balanceTotal = totalIngresos - totalGastos

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

      {/* Totales generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/60">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Ingresos</h3>
              <p className="text-3xl font-bold text-green-700">
                ${totalIngresos.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <TrendingUp className="w-10 h-10 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-red-50 to-rose-50 border-red-200/60">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Gastos</h3>
              <p className="text-3xl font-bold text-red-700">
                ${totalGastos.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <TrendingDown className="w-10 h-10 text-red-600 opacity-50" />
          </div>
        </div>

        <div className={`stat-card bg-gradient-to-br ${
          balanceTotal >= 0 
            ? 'from-blue-50 to-indigo-50 border-blue-200/60' 
            : 'from-amber-50 to-orange-50 border-amber-200/60'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-1">Balance Total</h3>
              <p className={`text-3xl font-bold ${balanceTotal >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                ${balanceTotal.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <DollarSign className={`w-10 h-10 opacity-50 ${balanceTotal >= 0 ? 'text-blue-600' : 'text-amber-600'}`} />
          </div>
        </div>
      </div>

      {/* Tabla de historial */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Período
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Ingresos
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Gastos
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {resumen.map((mes, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900 capitalize">
                      {mes.mes} {mes.año}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-green-700 font-semibold">
                      ${mes.ingresos.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-red-700 font-semibold">
                      ${mes.gastos.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold ${mes.balance >= 0 ? 'text-blue-700' : 'text-amber-700'}`}>
                      ${mes.balance.toLocaleString('es-UY', { minimumFractionDigits: 2 })}
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
  )
}
