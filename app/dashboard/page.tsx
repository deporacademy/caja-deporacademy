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

  // Cálculos de INGRESOS por moneda (TOTAL GENERAL)
  const ingresosUSD = ingresos
    .filter(ing => ing.moneda === 'USD')
    .reduce((sum, ing) => sum + Number(ing.monto), 0)

  const ingresosUYU = ingresos
    .filter(ing => !ing.moneda || ing.moneda === 'UYU')
    .reduce((sum, ing) => sum + Number(ing.monto), 0)

  // Cálculos de GASTOS por moneda (TOTAL GENERAL)
  const gastosUSD = gastos
    .filter(g => (g as any).moneda === 'USD')
    .reduce((sum, g) => sum + Number(g.monto), 0)

  const gastosUYU = gastos
    .filter(g => !(g as any).moneda || (g as any).moneda === 'UYU')
    .reduce((sum, g) => sum + Number(g.monto), 0)

  // BALANCES finales por moneda
  const cajaUSD = ingresosUSD - gastosUSD
  const cajaUYU = ingresosUYU - gastosUYU

  // Totales generales (para referencia)
  const totalIngresos = ingresosUSD + ingresosUYU
  const totalGastos = gastosUSD + gastosUYU
  const balance = totalIngresos - totalGastos

  // Datos para gráfico del año (todos los meses) - TODO
  const yearData = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(new Date().getFullYear(), i, 1)
    const startMonth = startOfMonth(monthDate).toISOString()
    const endMonth = endOfMonth(monthDate).toISOString()
    
    const ingresosMonth = ingresos
      .filter(ing => {
        // Parsear correctamente - split('T')[0] para ISO con hora, sino usar directo
        const fechaStr = ing.fecha.includes('T') ? ing.fecha.split('T')[0] : ing.fecha
        const ingDate = parse(fechaStr, 'yyyy-MM-dd', new Date())
        return (!ing.moneda || ing.moneda === 'UYU') && ingDate >= new Date(startMonth) && ingDate <= new Date(endMonth)
      })
      .reduce((sum, ing) => sum + Number(ing.monto), 0)
    
    const gastosMonth = gastos
      .filter(g => {
        // Parsear correctamente - split('T')[0] para ISO con hora, sino usar directo
        const fechaStr = (g as any).fecha.includes('T') ? (g as any).fecha.split('T')[0] : (g as any).fecha
        const gastoDate = parse(fechaStr, 'yyyy-MM-dd', new Date())
        return (!(g as any).moneda || (g as any).moneda === 'UYU') && gastoDate >= new Date(startMonth) && gastoDate <= new Date(endMonth)
      })
      .reduce((sum, g) => sum + Number(g.monto), 0)

    return {
      mes: format(monthDate, 'MMM', { locale: es }),
      Ingresos: ingresosMonth,
      Gastos: gastosMonth,
      Balance: ingresosMonth - gastosMonth
    }
  })

  // Datos para gráfico del año (todos los meses) - SOLO DÓLARES
  const yearDataUSD = Array.from({ length: 12 }, (_, i) => {
    const monthDate = new Date(new Date().getFullYear(), i, 1)
    const startMonth = startOfMonth(monthDate).toISOString()
    const endMonth = endOfMonth(monthDate).toISOString()
    
    const ingresosMonthUSD = ingresos
      .filter(ing => {
        // Parsear correctamente - split('T')[0] para ISO con hora, sino usar directo
        const fechaStr = ing.fecha.includes('T') ? ing.fecha.split('T')[0] : ing.fecha
        const ingDate = parse(fechaStr, 'yyyy-MM-dd', new Date())
        return ing.moneda === 'USD' && ingDate >= new Date(startMonth) && ingDate <= new Date(endMonth)
      })
      .reduce((sum, ing) => sum + Number(ing.monto), 0)
    
    const gastosMonthUSD = gastos
      .filter(g => {
        // Parsear correctamente - split('T')[0] para ISO con hora, sino usar directo
        const fechaStr = (g as any).fecha.includes('T') ? (g as any).fecha.split('T')[0] : (g as any).fecha
        const gastoDate = parse(fechaStr, 'yyyy-MM-dd', new Date())
        return (g as any).moneda === 'USD' && gastoDate >= new Date(startMonth) && gastoDate <= new Date(endMonth)
      })
      .reduce((sum, g) => sum + Number(g.monto), 0)

    return {
      mes: format(monthDate, 'MMM', { locale: es }),
      Ingresos: ingresosMonthUSD,
      Gastos: gastosMonthUSD,
      Balance: ingresosMonthUSD - gastosMonthUSD
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
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico del Año (Por Meses) - Dólares */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            {new Date().getFullYear()} (Dólares - Por Meses)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yearDataUSD}>
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

        {/* Gráfico del Año (Por Meses) - Pesos */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">
            {new Date().getFullYear()} (Pesos UYU - Por Meses)
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
