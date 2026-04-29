import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Briefcase, CheckSquare, Users, Activity, Cpu,
  ArrowLeftRight, AlertTriangle, FileHeart, Pill, Calendar, Euro,
  Wallet, GraduationCap, UserPlus, ShieldCheck, FolderOpen, Heart,
  Settings, LogOut, Sparkles, Share2, Upload
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const PAGE_TITLES: Record<string, string> = {
  '/pdl-onboarding': 'Tages-Briefing',
  '/pdl-office':     'PDL Büro',
  '/dashboard':      'Dashboard',
  '/patients':       'Patienten',
  '/monitoring':     'Überwachung & Vitalwerte',
  '/handover':       'Schichtübergabe',
  '/care-plans':     'Pflegepläne',
  '/medications':    'Medikamente',
  '/incidents':      'Vorfälle',
  '/rotas':          'Dienstplan',
  '/hr':             'Personal & HR',
  '/training':       'Schulungen',
  '/staff-docs':     'Personaldokumente',
  '/devices':        'Geräte',
  '/compliance':     'MDK Compliance',
  '/finance':        'Finanzen',
  '/payroll':        'Gehaltsabrechnung',
  '/ai':             'KI-Assistent Donna',
  '/social':         'Social Media',
  '/import':         'Datenimport',
  '/users':          'Benutzerverwaltung',
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
      { label: 'Patienten',   subtitle: 'Patientenliste verwalten',     path: '/patients',    icon: Users },
      { label: 'Monitoring',  subtitle: 'Vitalwerte & Überwachung',     path: '/monitoring',  icon: Activity },
      { label: 'Übergabe',    subtitle: 'Schichtwechsel dokumentieren', path: '/handover',    icon: ArrowLeftRight },
      { label: 'Pflegepläne', subtitle: 'Individuelle Pflegepläne',     path: '/care-plans',  icon: FileHeart },
      { label: 'Medikamente', subtitle: 'Medikamentenverwaltung',       path: '/medications', icon: Pill },
      { label: 'Vorfälle',    subtitle: 'Zwischenfälle melden',         path: '/incidents',   icon: AlertTriangle },
    ],
  },
  {
    heading: 'BETRIEB & TEAM',
    items: [
      { label: 'Dienstplan',  subtitle: 'Schichten planen',           path: '/rotas',       icon: Calendar },
      { label: 'HR',          subtitle: 'Urlaub & Personal',          path: '/hr',          icon: Heart },
      { label: 'Schulungen',  subtitle: 'Fortbildungen verwalten',    path: '/training',    icon: GraduationCap },
      { label: 'Dokumente',   subtitle: 'Zertifikate & Nachweise',    path: '/staff-docs',  icon: FolderOpen },
    ],
  },
  {
    heading: 'GERÄTE & COMPLIANCE',
    items: [
      { label: 'Geräte',         subtitle: 'Beatmungsgeräte verwalten', path: '/devices',    icon: Cpu },
      { label: 'MDK Compliance', subtitle: 'Qualitätsnachweise',        path: '/compliance', icon: ShieldCheck },
    ],
  },
  {
    heading: 'FINANZEN',
    items: [
      { label: 'Finanzen',    subtitle: 'Rechnungen & Transaktionen', path: '/finance',  icon: Euro },
      { label: 'Gehaltsabr.', subtitle: 'Gehaltsabrechnungen',        path: '/payroll',  icon: Wallet },
    ],
  },
  {
    heading: 'KI & TOOLS',
    items: [
      { label: 'KI-Tools',      subtitle: 'KI-Assistent & Berichte',     path: '/ai',          icon: Sparkles,    adminOnly: true },
      { label: 'Social Media',  subtitle: 'Facebook-Posts',              path: '/social',      icon: Share2,      adminOnly: true },
      { label: 'Datenimport',   subtitle: 'Excel & Dateien importieren', path: '/import',      icon: Upload,      adminOnly: true },
      { label: 'Bewerbungen',   subtitle: 'Stellenbewerbungen',          path: '/recruitment', icon: UserPlus,    adminOnly: true },
      { label: 'Benutzer',      subtitle: 'Zugänge verwalten',           path: '/users',       icon: Settings,    adminOnly: true },
    ],
  },
]

function DandelionLogo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34">
      <circle cx="17" cy="17" r="3.5" fill="white"/>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x1 = 17 + 5 * Math.cos(rad),  y1 = 17 + 5 * Math.sin(rad)
        const x2 = 17 + 13 * Math.cos(rad), y2 = 17 + 13 * Math.sin(rad)
        return (
          <g key={deg}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            <circle cx={x2} cy={y2} r="2.5" fill="white"/>
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

  const handleLogout = () => { logout(); navigate('/login') }

  const pageTitle = Object.entries(PAGE_TITLES).find(([p]) => location.pathname.startsWith(p))?.[1] ?? 'airflow CareOS'
  const dateStr   = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — always expanded, 260px */}
      <aside className="w-[260px] flex-shrink-0 bg-teal-500 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-teal-400 flex-shrink-0">
          <DandelionLogo/>
          <div className="leading-tight">
            <span className="italic text-white font-light text-lg">airflow</span>
            <span className="block text-xs font-bold text-white opacity-90">Fachpflegedienst</span>
          </div>
        </div>

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
                      `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors mb-0.5 ${
                        isActive ? 'bg-white border-l-[3px] border-teal-600 text-teal-600 -ml-[3px] pl-[15px]' : 'text-white hover:bg-teal-600/60'
                      }`
                    }
                  >
                    <Icon size={17} className="flex-shrink-0 mt-0.5"/>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">{label}</p>
                      <p className="text-[11px] italic opacity-70 leading-tight truncate">{subtitle}</p>
                    </div>
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>

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

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-charcoal leading-tight">{pageTitle}</h1>
            <p className="text-xs text-charcoal-lighter">Heute ist {dateStr}</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-sm text-charcoal hidden md:block">
              {greeting}, <span className="font-semibold">{user?.name ?? 'Frau Koroma'}</span>
            </p>
            <span className="text-xs bg-teal-100 text-teal-700 px-2.5 py-1 rounded-full font-medium">{user?.role}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-charcoal-lighter hover:text-red-500 transition-colors">
              <LogOut size={15}/> <span className="hidden sm:inline">Abmelden</span>
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
          <Outlet/>
        </main>
      </div>
    </div>
  )
}
