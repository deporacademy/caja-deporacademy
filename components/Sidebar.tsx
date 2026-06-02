'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  Settings,
  LogOut,
  Wallet,
  CheckSquare,
  Calendar,
  RefreshCw,
  DollarSign
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Ingresos', href: '/dashboard/ingresos', icon: TrendingUp },
  { name: 'Gastos', href: '/dashboard/gastos', icon: TrendingDown },
  { name: 'Márgenes', href: '/dashboard/margenes', icon: DollarSign },
  { name: 'Conversiones', href: '/dashboard/conversiones', icon: RefreshCw },
  { name: 'Revisar Movimientos', href: '/dashboard/revisar-movimientos', icon: CheckSquare },
  { name: 'Historial', href: '/dashboard/historial', icon: Calendar },
  { name: 'Configuración', href: '/dashboard/settings', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    // Limpiar localStorage
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-64 min-h-screen glass border-r border-slate-200/60 p-6 flex flex-col">
      {/* Logo */}
      <div className="mb-8">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg shadow-primary-500/30 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg gradient-text">DeporAcademy</h2>
            <p className="text-xs text-slate-600">Sistema de Caja</p>
          </div>
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="sidebar-link text-red-600 hover:bg-red-50 hover:text-red-700 mt-4"
      >
        <LogOut className="w-5 h-5" />
        <span>Cerrar sesión</span>
      </button>
    </aside>
  )
}
