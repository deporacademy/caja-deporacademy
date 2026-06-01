'use client'

import { useEffect, useState } from 'react'
import { supabase, type Ingreso, type Gasto } from '@/lib/supabase'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar
} from 'lucide-react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export default function DashboardPage() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Cargar datos de TODO EL AÑO (enero a diciembre)
      const año = new Date().getFullYear()
      const inicioAño = new Date(año, 0, 1).toISOString() // 1 enero
      const finAño = new Date(año, 11, 31).toISOString()  // 31 diciembre

      const { data: ingresosData } = await supabase
        .from('ingresos')
        .select('*')
        .gte('fecha', inicioAño)
        .lte('fecha', finAño)
        .eq('estado', 'approved')
        .order('fecha', { ascending: false })

      const { data: gastosData } = await supabase
        .from('gastos')
        .select('*, categorias(nombre, color)')
        .gte('fecha', format(new Date(inicioAño), 'yyyy-MM-dd'))
        .lte('fecha', format(new Date(finAño), 'yyyy-MM-dd'))
        .order('fecha', { ascending: false })

      setIngresos(ingresosData || [])
      setGastos(gastosData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalIngresos = ingresos.reduce((sum, ing) => sum + Number(ing.monto), 0)
  const totalGastos = gastos.reduce((sum, gasto) => sum + Number(gasto.monto), 0)
  const balance = totalIngresos - totalGastos

  // Calcular totales del MES ACTUAL (para las tarjetas)
  const mesActual = new Date()
  const inicioMes = startOfMonth(mesActual).toISOString()
  const finMes = endOfMonth(mesActual).toISOString()

  const ingresosActuales = ingresos
    .filter(ing => {
      const ingDate = new Date(ing.fecha)
      return ingDate >= new Date(inicioMes) && ingDate <= new Date(finMes)
    })
    .reduce((sum, ing) => sum + Number(ing.monto), 0)

  const gastosActuales = gastos
    .filter(g => {
      const gastoDate = new Date(g.fecha)
      return gastoDate >= new Date(inicioMes) && gastoDate <= new Date(finMes)
    })
    .reduce((sum, g) => sum + Number(g.monto), 0)

  const balanceActual = ingresosActuales - gastosActuales

  // Calcular totales por moneda - MES ACTUAL (para tarjetas)
  const ingresosUSD = ingresos
    .filter(ing => {
      const ingDate = new Date(ing.fecha)
      return ing.moneda === 'USD' && ingDate >= new Date(inicioMes) && ingDate <= new Date(finMes)
    })
    .reduce((sum, ing) => sum + Number(ing.monto), 0)

  const gastosUSD = gastos
    .filter(g => {
      const gastoDate = new Date(g.fecha)
      return (g as any).moneda === 'USD' && gastoDate >= new Date(inicioMes) && gastoDate <= new Date(finMes)
    })
    .reduce((sum, g) => sum + Number(g.monto), 0)

  const cajaUSD = ingresosUSD - gastosUSD

  const ingresosUYU = ingresos
    .filter(ing => {
      const ingDate = new Date(ing.fecha)
      return (!ing.moneda || ing.moneda === 'UYU') && ingDate >= new Date(inicioMes) && ingDate <= new Date(finMes)
    })
    .reduce((sum, ing) => sum + Number(ing.monto), 0)

  const gastosUYU = gastos
    .filter(g => {
      const gastoDate = new Date(g.fecha)
      return (!(g as any).moneda || (g as any).moneda === 'UYU') && gastoDate >= new Date(inicioMes) && gastoDate <= new Date(finMes)
    })
    .reduce((sum, g) => sum + Number(g.monto), 0)

  const cajaUYU = ingresosUYU - gastosUYU

  // Datos para gráfico del mes actual
  const mesActualData = [
    {
      nombre: format(new Date(), 'MMMM yyyy', { locale: es }),
      Ingresos: ingresosActuales,
      Gastos: gastosActuales,
      Balance: balanceActual
    }
  ]

  // Datos para gráfico del año (todos los meses)
  const yearData = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(new Date().getFullYear(), i, 1)
    const startMonth = startOfMonth(monthDate).toISOString()
    const endMonth = endOfMonth(monthDate).toISOString()
    
    const ingresosMonth = ingresos
      .filter(ing => {
        const ingDate = new Date(ing.fecha)
        return ingDate >= new Date(startMonth) && ingDate <= new Date(endMonth)
      })
      .reduce((sum, ing) => sum + Number(ing.monto), 0)
    
    const gastosMonth = gastos
      .filter(g => {
        const gastoDate = new Date(g.fecha)
        return gastoDate >= new Date(startMonth) && gastoDate <= new Date(endMonth)
      })
      .reduce((sum, g) => sum + Number(g.monto), 0)

    return {
      mes: format(monthDate, 'MMM', { locale: es }),
      Ingresos: ingresosMonth,
      Gastos: gastosMonth,
      Balance: ingresosMonth - gastosMonth
    }
  })

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
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          {format(new Date(), "MMMM yyyy", { locale: es })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Caja USD */}
        <div className="stat-card bg-gradient-to-br from-green-50 to-emerald-50 border-green-200/60">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/30 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="badge badge-success">
              💵 USD
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-600 mb-1">Caja Dólares</h3>
          <p className="text-3xl font-bold text-green-700">
            ${cajaUSD.toLocaleString('es-UY')}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Ingresos: ${ingresosUSD.toLocaleString('es-UY')} | Gastos: ${gastosUSD.toLocaleString('es-UY')}
          </p>
          <div className="mt-3 pt-3 border-t border-green-200/40">
            <p className="text-xs text-slate-600 font-semibold">Balance USD:</p>
            <p className={`text-lg font-bold ${cajaUSD >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              ${cajaUSD.toLocaleString('es-UY')}
            </p>
          </div>
        </div>

        {/* Caja UYU */}
        <div className="stat-card bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200/60">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/30 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <span className="badge badge-info">
              🪙 UYU
            </span>
          </div>
          <h3 className="text-sm font-semibold text-slate-600 mb-1">Caja Pesos Uruguayos</h3>
          <p className="text-3xl font-bold text-blue-700">
            ${cajaUYU.toLocaleString('es-UY')}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Ingresos: ${ingresosUYU.toLocaleString('es-UY')} | Gastos: ${gastosUYU.toLocaleString('es-UY')}
          </p>
          <div className="mt-3 pt-3 border-t border-blue-200/40">
            <p className="text-xs text-slate-600 font-semibold">Balance UYU:</p>
            <p className={`text-lg font-bold ${cajaUYU >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              ${cajaUYU.toLocaleString('es-UY')}
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico del Mes Actual */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            {format(new Date(), 'MMMM yyyy', { locale: es })} (Mes Actual)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mesActualData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="nombre" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value: any) => `$${Number(value).toLocaleString('es-UY')}`}
              />
              <Line type="monotone" dataKey="Ingresos" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 6 }} />
              <Line type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 6 }} />
              <Line type="monotone" dataKey="Balance" stroke="#8b5cf6" strokeWidth={3} dot={{ fill: '#8b5cf6', r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico del Año (Por Meses) */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            {new Date().getFullYear()} (Por Meses)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yearData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="mes" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value: any) => `$${Number(value).toLocaleString('es-UY')}`}
              />
              <Line type="monotone" dataKey="Ingresos" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 4 }} />
              <Line type="monotone" dataKey="Gastos" stroke="#ef4444" strokeWidth={2} dot={{ fill: '#ef4444', r: 4 }} />
              <Line type="monotone" dataKey="Balance" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transacciones recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Últimos ingresos */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Últimos Ingresos
          </h3>
          <div className="space-y-3">
            {ingresos.slice(0, 5).map((ingreso) => (
              <div key={ingreso.id} className="flex items-center justify-between p-3 bg-green-50/50 rounded-xl border border-green-100">
                <div>
                  <p className="font-semibold text-slate-900">{ingreso.descripcion || 'Pago recibido'}</p>
                  <p className="text-xs text-slate-600">{format(new Date(ingreso.fecha), 'dd/MM/yyyy HH:mm')}</p>
                </div>
                <span className="font-bold text-green-700">+${Number(ingreso.monto).toLocaleString('es-UY')} {ingreso.moneda || 'UYU'}</span>
              </div>
            ))}
            {ingresos.length === 0 && (
              <p className="text-center text-slate-400 py-8">No hay ingresos registrados</p>
            )}
          </div>
        </div>

        {/* Últimos gastos */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Últimos Gastos
          </h3>
          <div className="space-y-3">
            {gastos.slice(0, 5).map((gasto: any) => (
              <div key={gasto.id} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                <div>
                  <p className="font-semibold text-slate-900">{gasto.descripcion}</p>
                  <p className="text-xs text-slate-600">{format(new Date(gasto.fecha), 'dd/MM/yyyy')}</p>
                </div>
                <span className="font-bold text-red-700">-${Number(gasto.monto).toLocaleString('es-UY')} {gasto.moneda || 'UYU'}</span>
              </div>
            ))}
            {gastos.length === 0 && (
              <p className="text-center text-slate-400 py-8">No hay gastos registrados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
