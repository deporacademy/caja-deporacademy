'use client'

import { useEffect, useState } from 'react'
import { supabase, type Ingreso, type Gasto } from '@/lib/supabase'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  ArrowUpRight,
  ArrowDownRight
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
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const COLORS = ['#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444']

export default function DashboardPage() {
  const [ingresos, setIngresos] = useState<Ingreso[]>([])
  const [gastos, setGastos] = useState<Gasto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      // Cargar ingresos del mes actual
      const mesActual = new Date()
      const inicioMes = startOfMonth(mesActual).toISOString()
      const finMes = endOfMonth(mesActual).toISOString()

      const { data: ingresosData } = await supabase
        .from('ingresos')
        .select('*')
        .gte('fecha', inicioMes)
        .lte('fecha', finMes)
        .eq('estado', 'approved')
        .order('fecha', { ascending: false })

      const { data: gastosData } = await supabase
        .from('gastos')
        .select('*, categorias(nombre, color)')
        .gte('fecha', format(new Date(inicioMes), 'yyyy-MM-dd'))
        .lte('fecha', format(new Date(finMes), 'yyyy-MM-dd'))
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

  // Calcular totales por moneda
  const ingresosUSD = ingresos
    .filter(ing => ing.moneda === 'USD')
    .reduce((sum, ing) => sum + Number(ing.monto), 0)
  const gastosUSD = gastos
    .filter(g => (g as any).moneda === 'USD')
    .reduce((sum, g) => sum + Number(g.monto), 0)
  const cajaUSD = ingresosUSD - gastosUSD

  const ingresosUYU = ingresos
    .filter(ing => !ing.moneda || ing.moneda === 'UYU')
    .reduce((sum, ing) => sum + Number(ing.monto), 0)
  const gastosUYU = gastos
    .filter(g => !(g as any).moneda || (g as any).moneda === 'UYU')
    .reduce((sum, g) => sum + Number(g.monto), 0)
  const cajaUYU = ingresosUYU - gastosUYU

  // Datos para gráfico de línea (últimos 7 días)
  const lineData = Array.from({ length: 7 }, (_, i) => {
    const fecha = new Date()
    fecha.setDate(fecha.getDate() - (6 - i))
    const fechaStr = format(fecha, 'yyyy-MM-dd')
    
    const ingresoDia = ingresos
      .filter(ing => format(new Date(ing.fecha), 'yyyy-MM-dd') === fechaStr)
      .reduce((sum, ing) => sum + Number(ing.monto), 0)
    
    const gastoDia = gastos
      .filter(g => g.fecha === fechaStr)
      .reduce((sum, g) => sum + Number(g.monto), 0)

    return {
      fecha: format(fecha, 'dd/MM', { locale: es }),
      ingresos: ingresoDia,
      gastos: gastoDia
    }
  })

  // Datos para gráfico de pie (gastos por categoría)
  const gastosPorCategoria = gastos.reduce((acc: any, gasto: any) => {
    const categoria = gasto.categorias?.nombre || 'Sin categoría'
    const color = gasto.categorias?.color || '#6B7280'
    
    if (!acc[categoria]) {
      acc[categoria] = { nombre: categoria, valor: 0, color }
    }
    acc[categoria].valor += Number(gasto.monto)
    return acc
  }, {})

  const pieData = Object.values(gastosPorCategoria).map((cat: any) => ({
    name: cat.nombre,
    value: cat.valor,
    color: cat.color
  }))

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
          <h3 className="text-sm font-semibold text-slate-600 mb-1">Caja Pesos</h3>
          <p className="text-3xl font-bold text-blue-700">
            ${cajaUYU.toLocaleString('es-UY')}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Ingresos: ${ingresosUYU.toLocaleString('es-UY')} | Gastos: ${gastosUYU.toLocaleString('es-UY')}
          </p>
        </div>

        {/* Balance del mes */}
        <div className={`stat-card ${balance >= 0 ? 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200/60' : 'bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200/60'}`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 ${balance >= 0 ? 'bg-gradient-to-br from-purple-500 to-pink-600 shadow-purple-500/30' : 'bg-gradient-to-br from-amber-500 to-yellow-600 shadow-amber-500/30'} rounded-xl shadow-lg flex items-center justify-center`}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-slate-600 mb-1">Balance del Mes</h3>
          <p className={`text-3xl font-bold ${balance >= 0 ? 'text-purple-700' : 'text-amber-700'}`}>
            ${balance.toLocaleString('es-UY')}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Total ingresos: ${totalIngresos.toLocaleString('es-UY')} | Total gastos: ${totalGastos.toLocaleString('es-UY')}
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de línea */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Últimos 7 días</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="fecha" stroke="#64748b" style={{ fontSize: '12px' }} />
              <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Line type="monotone" dataKey="ingresos" stroke="#22c55e" strokeWidth={3} dot={{ fill: '#22c55e', r: 4 }} />
              <Line type="monotone" dataKey="gastos" stroke="#ef4444" strokeWidth={3} dot={{ fill: '#ef4444', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de totales del mes */}
        <div className="card p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Total Mes (Acumulado)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={[
              {
                nombre: 'Totales',
                Ingresos: totalIngresos,
                Gastos: totalGastos,
                Balance: balance
              }
            ]}>
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
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}
                  formatter={(value: any) => `$${value.toLocaleString('es-UY')}`}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[250px] text-slate-400">
              No hay gastos registrados
            </div>
          )}
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
