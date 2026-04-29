import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, CheckSquare, Users, Activity, Cpu,
  ArrowLeftRight, AlertTriangle, FileHeart, Pill, Calendar, Euro,
  Wallet, GraduationCap, UserPlus, ShieldCheck, FolderOpen, Heart,
  Settings, LogOut, Sparkles, Share2, Upload, Menu, X
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const PAGE_TITLES: Record<string, string> = {
  '/pdl-onboarding': 'Tages-Briefing',
  '/pdl-office':     'PDL Büro',
  '/dashboard':      'Dashboard',
  '/patients':       'Patienten',
  '/monitoring':     'Überwachung',
  '/handover':       'Übergabe',
  '/care-plans':     'Pflegepläne',
  '/medications':    'Medikamente',
  '/incidents':      'Vorfälle',
  '/rotas':          'Dienstplan',
  '/hr':             'HR',
  '/training':       'Schulungen',
  '/staff-docs':     'Dokumente',
  '/devices':        'Geräte',
  '/compliance':     'MDK',
  '/finance':        'Finanzen',
  '/payroll':        'Gehalt',
  '/ai':             'KI Donna',
  '/social':         'Social',
  '/import':         'Import',
  '/users':          'Benutzer',
  '/recruitment':    'Bewerbungen',
}

interface NavItem { label: string; subtitle: string; path: string; icon: React.ElementType; adminOnly?: boolean }
interface NavGroup { heading: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'HAUPTMENÜ',
    items: [
      { label: 'PDL Onboarding', subtitle: 'Ihre Tageszentrale',     path: '/pdl-onboarding', icon: LayoutDashboard, adminOnly: true },
      { label: 'PDL Büro',       subtitle: 'E-Mail & Kalender',      path: '/pdl-office',     icon: Briefcase,       adminOnly: true },
      { label: 'Dashboard',      subtitle: 'Aufgaben & Übersicht',   path: '/dashboard',      icon: CheckSquare },
    ],
  },
  {
    heading: 'PATIENTEN & PFLEGE',
    items: [
      { label: 'Patienten',   subtitle: 'Patientenliste',               path: '/patients',    icon: Users },
      { label: 'Monitoring',  subtitle: 'Vitalwerte & Überwachung',     path: '/monitoring',  icon: Activity },
      { label: 'Übergabe',    subtitle: 'Schichtwechsel',               path: '/handover',    icon: ArrowLeftRight },
      { label: 'Pflegepläne', subtitle: 'Individuelle Pflegepläne',     path: '/care-plans',  icon: FileHeart },
      { label: 'Medikamente', subtitle: 'Medikamentenverwaltung',       path: '/medications', icon: Pill },
      { label: 'Vorfälle',    subtitle: 'Zwischenfälle melden',         path: '/incidents',   icon: AlertTriangle },
    ],
  },
  {
    heading: 'BETRIEB & TEAM',
    items: [
      { label: 'Dienstplan',  subtitle: 'Schichten planen',          path: '/rotas',       icon: Calendar },
      { label: 'HR',          subtitle: 'Urlaub & Personal',         path: '/hr',          icon: Heart },
      { label: 'Schulungen',  subtitle: 'Fortbildungen',             path: '/training',    icon: GraduationCap },
      { label: 'Dokumente',   subtitle: 'Zertifikate & Nachweise',   path: '/staff-docs',  icon: FolderOpen },
    ],
  },
  {
    heading: 'GERÄTE & COMPLIANCE',
    items: [
      { label: 'Geräte',         subtitle: 'Beatmungsgeräte',   path: '/devices',    icon: Cpu },
      { label: 'MDK Compliance', subtitle: 'Qualitätsnachweise', path: '/compliance', icon: ShieldCheck },
    ],
  },
  {
    heading: 'FINANZEN',
    items: [
      { label: 'Finanzen',    subtitle: 'Rechnungen',         path: '/finance',  icon: Euro },
      { label: 'Gehaltsabr.', subtitle: 'Gehaltsabrechnungen', path: '/payroll', icon: Wallet },
    ],
  },
  {
    heading: 'KI & TOOLS',
    items: [
      { label: 'KI-Tools',     subtitle: 'KI-Assistent',      path: '/ai',          icon: Sparkles,  adminOnly: true },
      { label: 'Social Media', subtitle: 'Facebook-Posts',    path: '/social',      icon: Share2,    adminOnly: true },
      { label: 'Datenimport',  subtitle: 'Excel importieren', path: '/import',      icon: Upload,    adminOnly: true },
      { label: 'Bewerbungen',  subtitle: 'Stellenbewerbungen',path: '/recruitment', icon: UserPlus,  adminOnly: true },
      { label: 'Benutzer',     subtitle: 'Zugänge verwalten', path: '/users',       icon: Settings,  adminOnly: true },
    ],
  },
]

function DandelionLogo({ size = 34 }: { size?: number }) {
  const c = size / 2
  const r = size * 0.1
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={r} fill="white"/>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x1 = c + (r + 2) * Math.cos(rad), y1 = c + (r + 2) * Math.sin(rad)
        const x2 = c + (size * 0.38) * Math.cos(rad), y2 = c + (size * 0.38) * Math.sin(rad)
        return (
          <g key={deg}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth={size * 0.04} strokeLinecap="round"/>
            <circle cx={x2} cy={y2} r={size * 0.075} fill="white"/>
          </g>
        )
      })}
    </svg>
  )
}

export default function Layout() {
  const { user, logout, isAdmin } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar whenever route changes (mobile tap-to-navigate)
  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login') }
  const pageTitle = Object.entries(PAGE_TITLES).find(([p]) => location.pathname.startsWith(p))?.[1] ?? 'airflow CareOS'
  const dateStr   = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'
  const initials  = user?.name ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'U'

  // Bottom nav for mobile — 5 priority tabs
  const startPath = isAdmin ? '/pdl-onboarding' : '/dashboard'
  const bottomNav = [
    { label: 'Start',      path: startPath,    icon: LayoutDashboard },
    { label: 'Patienten',  path: '/patients',  icon: Users },
    { label: 'Monitoring', path: '/monitoring', icon: Activity },
    { label: 'Dienstplan', path: '/rotas',      icon: Calendar },
    { label: '✨ KI',      path: '/ai',         icon: Sparkles },
  ]

  const SidebarNav = () => (
    <nav className="flex-1 overflow-y-auto py-3 px-2">
      {NAV_GROUPS.map((group) => {
        const visible = group.items.filter(i => !i.adminOnly || isAdmin)
        if (!visible.length) return null
        return (
          <div key={group.heading} className="mb-4">
            <p className="px-3 pb-1 text-[10px] font-bold text-white/50 uppercase tracking-widest">{group.heading}</p>
            {visible.map(({ label, subtitle, path, icon: Icon }) => (
              <NavLink key={path} to={path} title={label}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 rounded-lg transition-colors mb-0.5
                   min-h-[48px] py-2
                   ${isActive
                     ? 'bg-white border-l-[3px] border-teal-600 text-teal-600 -ml-[3px] pl-[15px]'
                     : 'text-white hover:bg-teal-600/60 active:bg-teal-600'
                   }`
                }
              >
                <Icon size={22} className="flex-shrink-0"/>
                <div className="min-w-0">
                  <p className="text-base font-semibold leading-tight truncate md:text-sm">{label}</p>
                  <p className="text-[11px] italic opacity-70 leading-tight truncate hidden lg:block">{subtitle}</p>
                </div>
              </NavLink>
            ))}
          </div>
        )
      })}
    </nav>
  )

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-gray-50">

      {/* ── MOBILE OVERLAY (dark backdrop) ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR ──
           Mobile:  fixed overlay, slides in from left, 85vw max 320px
           Tablet:  fixed 200px, always visible
           Desktop: 260px, always visible */}
      <aside
        className={`
          fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-teal-500 transition-transform duration-300 ease-in-out
          w-[min(85vw,320px)]
          md:relative md:z-auto md:w-[200px] md:transform-none md:flex-shrink-0
          lg:w-[260px]
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo row */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-teal-400 flex-shrink-0">
          <div className="flex items-center gap-3">
            <DandelionLogo size={32}/>
            <div className="leading-tight">
              <span className="italic text-white font-light text-lg">airflow</span>
              <span className="block text-xs font-bold text-white opacity-90">Fachpflegedienst</span>
            </div>
          </div>
          {/* Close button — mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 text-white/80 hover:text-white rounded-lg hover:bg-teal-600 active:bg-teal-700"
            aria-label="Menü schließen"
          >
            <X size={22}/>
          </button>
        </div>

        <SidebarNav/>

        {/* Credit */}
        <div className="border-t border-teal-400/40 px-4 py-3 flex-shrink-0">
          <p className="text-[10px] text-white/40 text-center">
            Entwickelt von{' '}
            <a href="https://maxpromo.digital" target="_blank" rel="noopener noreferrer" className="text-white/60 underline hover:text-white">
              maxpromo.digital
            </a>
          </p>
        </div>
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 flex items-center justify-between px-4 h-14 md:h-auto md:px-6 md:py-3 flex-shrink-0 shadow-sm">

          {/* Mobile left: hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 text-charcoal hover:bg-gray-100 rounded-lg active:bg-gray-200"
              aria-label="Menü öffnen"
            >
              <Menu size={22}/>
            </button>
            <div className="flex items-center gap-2">
              <svg width="22" height="22" viewBox="0 0 34 34">
                <circle cx="17" cy="17" r="3.5" fill="#00ABA8"/>
                {[0,45,90,135,180,225,270,315].map((deg) => {
                  const rad = (deg*Math.PI)/180
                  const x2 = 17+13*Math.cos(rad), y2 = 17+13*Math.sin(rad)
                  return <circle key={deg} cx={x2} cy={y2} r="2.5" fill="#00ABA8"/>
                })}
              </svg>
              <span className="italic text-charcoal font-light text-base leading-none">airflow</span>
            </div>
          </div>

          {/* Desktop left: page title */}
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-charcoal leading-tight">{pageTitle}</h1>
            <p className="text-xs text-charcoal-lighter">Heute ist {dateStr}</p>
          </div>

          {/* Right: different on mobile vs desktop */}
          <div className="flex items-center gap-3">
            {/* Desktop */}
            <p className="text-sm text-charcoal hidden md:block">
              {greeting}, <span className="font-semibold">{user?.name ?? 'Frau Koroma'}</span>
            </p>
            <span className="text-xs bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full font-medium hidden md:inline">{user?.role}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-charcoal-lighter hover:text-red-500 transition-colors">
              <LogOut size={16}/>
              <span className="hidden md:inline">Abmelden</span>
            </button>

            {/* Mobile: user initials circle */}
            <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold md:hidden">
              {initials}
            </div>
          </div>
        </header>

        {/* Page title bar (mobile only, below top bar) */}
        <div className="md:hidden bg-gray-50 border-b border-gray-100 px-4 py-2">
          <p className="text-sm font-semibold text-charcoal">{pageTitle}</p>
        </div>

        {/* Content — pb-20 on mobile to clear bottom nav */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6 pb-20 md:pb-6">
          <Outlet/>
        </main>
      </div>

      {/* ── BOTTOM NAV (mobile only) ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)] md:hidden z-30">
        <div className="flex h-16">
          {bottomNav.map(({ label, path, icon: Icon }) => {
            const isActive = location.pathname.startsWith(path) ||
              (path === startPath && (location.pathname === '/pdl-onboarding' || location.pathname === '/dashboard'))
            return (
              <NavLink
                key={path}
                to={path}
                className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors active:bg-teal-50"
              >
                <Icon size={22} className={isActive ? 'text-teal-500' : 'text-gray-400'}/>
                <span className={`text-[10px] font-medium leading-tight ${isActive ? 'text-teal-600' : 'text-gray-400'}`}>
                  {label}
                </span>
                {isActive && <span className="absolute bottom-0 w-6 h-0.5 bg-teal-500 rounded-full"/>}
              </NavLink>
            )
          })}
        </div>
      </nav>

    </div>
  )
}
