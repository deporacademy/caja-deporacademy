'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
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
  DollarSign,
  Menu,
  X
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
  const [isOpen, setIsOpen] = useState(false)

  const handleLogout = async () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setIsOpen(false)
    router.push('/')
    router.refresh()
  }

  const handleNavClick = () => {
    setIsOpen(false)
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 min-h-screen glass border-r border-slate-200/60 p-6 flex-col sticky top-0">
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

      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md border border-slate-200 hover:bg-slate-50"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-slate-900" />
        ) : (
          <Menu className="w-6 h-6 text-slate-900" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={`md:hidden fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 shadow-lg p-6 flex flex-col z-40 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="mb-8 mt-12">
          <Link href="/dashboard" onClick={handleNavClick} className="flex items-center gap-3 group">
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
                onClick={handleNavClick}
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
    </>
  )
}
