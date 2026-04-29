import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Activity, AlertTriangle, Cpu, FileCheck, ArrowLeftRight, Heart, Calendar, Euro, Clock, Users, Sparkles, FileText, BarChart2, Upload } from 'lucide-react'
import StatCard from '../components/StatCard'
import StatusBanner from '../components/StatusBanner'
import api from '../lib/api'

interface Briefing {
  datum: string
  offeneAlerts: number; kritischeVorfaelle: number; geraeteDefekt: number
  fehlendeDokumente: number; offeneUebergaben: number; aktiveKrankmeldungen: number
  offeneUrlaubsantraege: number; ueberfaelligeRechnungen: number; wartungFaellig: number
  patienten: { id: string; vorname: string; nachname: string; beatmungspflichtig: boolean; status: string }[]
}
interface AlertItem { id: string; parameter: string; wert: string; alertLevel: string; patient?: { vorname: string; nachname: string }; createdAt: string }

const MODULES = [
  { label: 'Patienten',       subtitle: 'Patientenliste',        path: '/patients',    icon: '👥' },
  { label: 'Monitoring',      subtitle: 'Vitalwerte',             path: '/monitoring',  icon: '📊' },
  { label: 'Übergabe',        subtitle: 'Schichtübergabe',        path: '/handover',    icon: '🔄' },
  { label: 'Pflegepläne',     subtitle: 'Individuelle Pläne',    path: '/care-plans',  icon: '📋' },
  { label: 'Medikamente',     subtitle: 'Medikamentenliste',      path: '/medications', icon: '💊' },
  { label: 'Vorfälle',        subtitle: 'Zwischenfälle',          path: '/incidents',   icon: '⚠️' },
  { label: 'Dienstplan',      subtitle: 'Schichten planen',       path: '/rotas',       icon: '📅' },
  { label: 'Geräte',          subtitle: 'Beatmungsgeräte',       path: '/devices',     icon: '🖥️' },
  { label: 'MDK Compliance',  subtitle: 'Qualitätsnachweise',    path: '/compliance',  icon: '✅' },
  { label: 'Finanzen',        subtitle: 'Rechnungen',             path: '/finance',     icon: '💶' },
  { label: 'Schulungen',      subtitle: 'Fortbildungen',          path: '/training',    icon: '🎓' },
  { label: 'Dokumente',       subtitle: 'Zertifikate',            path: '/staff-docs',  icon: '📂' },
  { label: 'HR',              subtitle: 'Urlaub & Personal',      path: '/hr',          icon: '👩‍💼' },
  { label: 'KI-Assistent',    subtitle: 'Donna',                  path: '/ai',          icon: '✨' },
  { label: 'Datenimport',     subtitle: 'Excel importieren',      path: '/import',      icon: '📥' },
  { label: 'Benutzer',        subtitle: 'Zugänge',                path: '/users',       icon: '👤' },
]

export default function PdlOnboardingPage() {
  const navigate = useNavigate()

  const { data: briefingData, isLoading } = useQuery({
    queryKey: ['pdl-briefing'],
    queryFn:  () => api.get<{ success: boolean; briefing: Briefing }>('/pdl/briefing').then(r => r.data.briefing),
    refetchInterval: 120000,
  })
  const { data: alertsData } = useQuery({
    queryKey: ['monitoring-alerts-open'],
    queryFn:  () => api.get<{ success: boolean; alerts: AlertItem[] }>('/monitoring/alerts/open').then(r => r.data.alerts),
  })

  const b = briefingData
  const hour    = new Date().getHours()
  const greet   = hour < 12 ? 'Guten Morgen' : hour < 18 ? 'Guten Tag' : 'Guten Abend'
  const dateStr = new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Greeting banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 text-white p-5 md:p-6 shadow-lg">
        <h1 className="text-xl md:text-2xl font-bold mb-1">{greet}, Frau Koroma 👋</h1>
        <p className="text-teal-100 text-sm">Heute ist {dateStr}</p>
        <p className="text-teal-50 text-xs mt-1.5 hidden md:block">Hier sehen Sie auf einen Blick, was heute wichtig ist.</p>
      </div>

      {/* Alert banners */}
      {!isLoading && b && (
        <div className="space-y-2">
          {b.offeneAlerts > 0 && (
            <StatusBanner type="error" message={`🚨 ${b.offeneAlerts} kritische Alerts offen`} actionLabel="Ansehen →" onAction={() => navigate('/monitoring')}/>
          )}
          {b.kritischeVorfaelle > 0 && (
            <StatusBanner type="error" message={`⚠️ ${b.kritischeVorfaelle} kritische Vorfälle`} actionLabel="Ansehen →" onAction={() => navigate('/incidents')}/>
          )}
          {b.fehlendeDokumente > 0 && (
            <StatusBanner type="warning" message={`📄 ${b.fehlendeDokumente} Dokumente laufen ab`} actionLabel="Prüfen →" onAction={() => navigate('/staff-docs')}/>
          )}
        </div>
      )}

      {/* Stat grid — 2 cols mobile, 3 md, 5 xl */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/>
          <p className="text-charcoal-lighter text-sm">⏳ Daten werden geladen…</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
            <Link to="/monitoring"  className="block"><StatCard label="Offene Alerts"           value={b?.offeneAlerts ?? 0}            icon={<Activity size={18}/>}      color={b && b.offeneAlerts > 0 ? 'red' : 'teal'}/></Link>
            <Link to="/incidents"   className="block"><StatCard label="Krit. Vorfälle"          value={b?.kritischeVorfaelle ?? 0}      icon={<AlertTriangle size={18}/>}  color={b && b.kritischeVorfaelle > 0 ? 'red' : 'teal'}/></Link>
            <Link to="/devices"     className="block"><StatCard label="Defekte Geräte"          value={b?.geraeteDefekt ?? 0}           icon={<Cpu size={18}/>}           color={b && b.geraeteDefekt > 0 ? 'red' : 'teal'}/></Link>
            <Link to="/staff-docs"  className="block"><StatCard label="Dokumente ablaufend"     value={b?.fehlendeDokumente ?? 0}       icon={<FileCheck size={18}/>}     color={b && b.fehlendeDokumente > 0 ? 'yellow' : 'teal'}/></Link>
            <Link to="/handover"    className="block"><StatCard label="Offene Übergaben"        value={b?.offeneUebergaben ?? 0}        icon={<ArrowLeftRight size={18}/>} color="yellow"/></Link>
            <Link to="/hr"          className="block"><StatCard label="Krankmeldungen"          value={b?.aktiveKrankmeldungen ?? 0}    icon={<Heart size={18}/>}         color={b && b.aktiveKrankmeldungen > 0 ? 'orange' : 'teal'}/></Link>
            <Link to="/hr"          className="block"><StatCard label="Urlaubsanträge"          value={b?.offeneUrlaubsantraege ?? 0}   icon={<Calendar size={18}/>}      color="yellow"/></Link>
            <Link to="/finance"     className="block"><StatCard label="Überfällige Rechng."     value={b?.ueberfaelligeRechnungen ?? 0} icon={<Euro size={18}/>}          color={b && b.ueberfaelligeRechnungen > 0 ? 'red' : 'teal'}/></Link>
            <Link to="/devices"     className="block"><StatCard label="Wartung fällig"          value={b?.wartungFaellig ?? 0}          icon={<Clock size={18}/>}         color={b && b.wartungFaellig > 0 ? 'orange' : 'teal'}/></Link>
            <Link to="/patients"    className="block"><StatCard label="Aktive Patienten"        value={b?.patienten?.length ?? 0}       icon={<Users size={18}/>}         color="teal"/></Link>
          </div>

          {/* Quick actions — 2 cols mobile, 4 desktop */}
          <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6">
            <h2 className="font-bold text-charcoal text-base md:text-lg mb-1">Häufig genutzte Aktionen</h2>
            <p className="text-sm text-charcoal-lighter mb-3 md:mb-4 hidden md:block">Klicken Sie auf eine Aktion, um direkt loszulegen.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
              {[
                { icon: <Sparkles size={18}/>, label: '✨ Übergabe schreiben', path: '/handover', color: 'bg-teal-500 text-white' },
                { icon: <BarChart2 size={18}/>, label: '📊 Vitalwerte eintragen', path: '/monitoring', color: 'bg-teal-50 text-teal-700 border border-teal-200' },
                { icon: <Upload size={18}/>, label: '📥 Daten importieren', path: '/import', color: 'bg-teal-50 text-teal-700 border border-teal-200' },
                { icon: <FileText size={18}/>, label: '📋 Patient anlegen', path: '/patients', color: 'bg-teal-50 text-teal-700 border border-teal-200' },
              ].map((a, i) => (
                <Link key={i} to={a.path} className={`flex items-center gap-2 p-3 md:p-4 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity active:opacity-75 ${a.color}`}>
                  {a.icon} <span className="leading-tight">{a.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Module grid — 3 cols mobile, 4 md, dynamic larger */}
          <div className="bg-white rounded-2xl shadow-sm p-4 md:p-6">
            <h2 className="font-bold text-charcoal text-base md:text-lg mb-1">Was möchten Sie heute tun?</h2>
            <p className="text-sm text-charcoal-lighter mb-3 md:mb-4 hidden md:block">Tippen Sie auf einen Bereich, um direkt loszulegen.</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-2 md:gap-3">
              {MODULES.map(m => (
                <Link key={m.path} to={m.path}
                  className="flex flex-col items-center gap-1.5 bg-gray-50 hover:bg-teal-50 border border-gray-100 hover:border-teal-300 rounded-xl p-3 transition-all active:bg-teal-100 text-center">
                  <span className="text-2xl">{m.icon}</span>
                  <p className="font-semibold text-xs text-charcoal leading-tight">{m.label}</p>
                  <p className="text-[10px] text-charcoal-lighter leading-tight hidden sm:block">{m.subtitle}</p>
                </Link>
              ))}
            </div>
          </div>

          {/* Open alerts panel */}
          {alertsData && alertsData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-red-100">
              <div className="px-4 py-3 bg-red-50 border-b border-red-100">
                <h3 className="font-semibold text-red-700 text-sm">🚨 Offene Meldungen ({alertsData.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
                    <tr>
                      <th className="px-4 py-3 text-left">Patient</th>
                      <th className="px-4 py-3 text-left">Messwert</th>
                      <th className="px-4 py-3 text-left">Wert</th>
                      <th className="px-4 py-3 text-left">Level</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {alertsData.slice(0, 5).map(alert => (
                      <tr key={alert.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{alert.patient ? `${alert.patient.vorname} ${alert.patient.nachname}` : '—'}</td>
                        <td className="px-4 py-3">{alert.parameter}</td>
                        <td className="px-4 py-3 font-semibold">{alert.wert}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-bold ${alert.alertLevel === 'ROT' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {alert.alertLevel === 'ROT' ? '🔴' : '🟡'} {alert.alertLevel}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
