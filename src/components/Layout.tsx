import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, CheckSquare, Users, Activity, Cpu,
  ArrowLeftRight, AlertTriangle, FileHeart, Pill, Calendar, Euro,
  Wallet, GraduationCap, UserPlus, ShieldCheck, FolderOpen, Heart,
  Settings, LogOut, ChevronLeft, Menu, Sparkles, Share2, Upload
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { label: 'PDL Onboarding',    path: '/pdl-onboarding', icon: LayoutDashboard, adminOnly: true },
  { label: 'PDL Büro',          path: '/pdl-office',     icon: Briefcase,       adminOnly: true },
  { label: 'Dashboard',         path: '/dashboard',      icon: CheckSquare },
  { label: 'Patienten',         path: '/patients',       icon: Users },
  { label: 'Monitoring',        path: '/monitoring',     icon: Activity },
  { label: 'Geräte',            path: '/devices',        icon: Cpu },
  { label: 'Übergabe',          path: '/handover',       icon: ArrowLeftRight },
  { label: 'Vorfälle',          path: '/incidents',      icon: AlertTriangle },
  { label: 'Pflegepläne',       path: '/care-plans',     icon: FileHeart },
  { label: 'Medikamente',       path: '/medications',    icon: Pill },
  { label: 'Dienstplan',        path: '/rotas',          icon: Calendar },
  { label: 'Finanzen',          path: '/finance',        icon: Euro },
  { label: 'Gehaltsabr.',       path: '/payroll',        icon: Wallet },
  { label: 'Schulungen',        path: '/training',       icon: GraduationCap },
  { label: 'Bewerbungen',       path: '/recruitment',    icon: UserPlus },
  { label: 'MDK Compliance',    path: '/compliance',     icon: ShieldCheck },
  { label: 'Dokumente',         path: '/staff-docs',     icon: FolderOpen },
  { label: 'HR',                path: '/hr',             icon: Heart },
  { label: 'KI-Tools',          path: '/ai',             icon: Sparkles,        adminOnly: true },
  { label: 'Social Media',      path: '/social',         icon: Share2,          adminOnly: true },
  { label: 'Datenimport',       path: '/import',         icon: Upload,          adminOnly: true },
  { label: 'Benutzer',          path: '/users',          icon: Settings,        adminOnly: true },
]

function DandelionLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="3" fill="white" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x1 = 16 + 4 * Math.cos(rad), y1 = 16 + 4 * Math.sin(rad)
        const x2 = 16 + 12 * Math.cos(rad), y2 = 16 + 12 * Math.sin(rad)
        return (
          <g key={deg}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx={x2} cy={y2} r="2.5" fill="white" />
          </g>
        )
      })}
    </svg>
  )
}

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }

  const items = NAV_ITEMS.filter(i => !i.adminOnly || isAdmin)

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`bg-teal-500 flex flex-col transition-all duration-200 ${collapsed ? 'w-16' : 'w-60'} flex-shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-teal-400">
          <DandelionLogo />
          {!collapsed && (
            <div className="leading-tight">
              <span className="italic text-white font-light text-lg">airflow</span>
              <span className="block text-xs font-bold text-white opacity-90">Fachpflegedienst</span>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
          {items.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              title={label}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive ? 'bg-white text-teal-600 font-semibold' : 'text-white hover:bg-teal-600'
                }`
              }
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center justify-center p-4 text-white hover:bg-teal-600 border-t border-teal-400"
        >
          {collapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <span className="text-sm text-charcoal-lighter">
            airflow <span className="font-semibold text-teal-600">CareOS</span>
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-charcoal">{user?.name}</span>
            <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">{user?.role}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm text-charcoal-lighter hover:text-red-500 transition-colors"
            >
              <LogOut size={16} /> Abmelden
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
