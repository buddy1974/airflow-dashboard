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
  { label: 'Patienten',        subtitle: 'Patientenliste ansehen und bearbeiten', path: '/patients',    bg: 'bg-teal-500',   icon: '👥' },
  { label: 'Monitoring',       subtitle: 'Vitalwerte & Überwachung',             path: '/monitoring',  bg: 'bg-red-500',    icon: '📊' },
  { label: 'Übergabe',         subtitle: 'Schichtübergabe schreiben',            path: '/handover',    bg: 'bg-teal-600',   icon: '🔄' },
  { label: 'Pflegepläne',      subtitle: 'Individuelle Pflegepläne',            path: '/care-plans',  bg: 'bg-teal-500',   icon: '📋' },
  { label: 'Medikamente',      subtitle: 'Medikamentenverwaltung',               path: '/medications', bg: 'bg-teal-600',   icon: '💊' },
  { label: 'Vorfälle',         subtitle: 'Zwischenfälle dokumentieren',          path: '/incidents',   bg: 'bg-orange-500', icon: '⚠️' },
  { label: 'Dienstplan',       subtitle: 'Schichten planen',                     path: '/rotas',       bg: 'bg-teal-500',   icon: '📅' },
  { label: 'Geräte',           subtitle: 'Beatmungsgeräte & Wartung',           path: '/devices',     bg: 'bg-teal-600',   icon: '🖥️' },
  { label: 'MDK Compliance',   subtitle: 'Qualitätsnachweise',                  path: '/compliance',  bg: 'bg-orange-500', icon: '✅' },
  { label: 'Finanzen',         subtitle: 'Rechnungen & Transaktionen',          path: '/finance',     bg: 'bg-teal-500',   icon: '💶' },
  { label: 'Schulungen',       subtitle: 'Fortbildungen verwalten',             path: '/training',    bg: 'bg-teal-600',   icon: '🎓' },
  { label: 'Dokumente',        subtitle: 'Zertifikate & Nachweise',             path: '/staff-docs',  bg: 'bg-teal-500',   icon: '📂' },
  { label: 'HR',               subtitle: 'Urlaub & Personal',                   path: '/hr',          bg: 'bg-teal-600',   icon: '👩‍💼' },
  { label: 'KI-Assistent',     subtitle: 'Donna — KI für airflow',              path: '/ai',          bg: 'bg-teal-500',   icon: '✨' },
  { label: 'Datenimport',      subtitle: 'Excel & Dateien importieren',         path: '/import',      bg: 'bg-teal-600',   icon: '📥' },
  { label: 'Benutzer',         subtitle: 'Zugänge verwalten',                   path: '/users',       bg: 'bg-charcoal',   icon: '👤' },
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
    <div className="space-y-6">
      {/* Greeting banner */}
      <div className="rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 text-white p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-1">{greet}, Frau Koroma 👋</h1>
        <p className="text-teal-100 text-sm">Heute ist {dateStr} · Ihr persönliches Tagesbriefing</p>
        <p className="text-teal-50 text-xs mt-2">Hier sehen Sie auf einen Blick, was heute wichtig ist.</p>
      </div>

      {/* Conditional alert banners */}
      {!isLoading && b && (
        <div className="space-y-2">
          {b.offeneAlerts > 0 && (
            <StatusBanner type="error" message={`🚨 ${b.offeneAlerts} kritische Alerts offen — sofortige Aufmerksamkeit erforderlich`} actionLabel="Jetzt ansehen →" onAction={() => navigate('/monitoring')}/>
          )}
          {b.kritischeVorfaelle > 0 && (
            <StatusBanner type="error" message={`⚠️ ${b.kritischeVorfaelle} kritische Vorfälle ungeklärt`} actionLabel="Ansehen →" onAction={() => navigate('/incidents')}/>
          )}
          {b.fehlendeDokumente > 0 && (
            <StatusBanner type="warning" message={`📄 ${b.fehlendeDokumente} Dokumente laufen demnächst ab`} actionLabel="Dokumente prüfen →" onAction={() => navigate('/staff-docs')}/>
          )}
        </div>
      )}

      {/* Stat grid */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <div className="animate-spin h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-3"/>
            <p className="text-charcoal-lighter text-sm">⏳ Daten werden geladen…</p>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <Link to="/monitoring"  className="block"><StatCard label="Offene Alerts"           value={b?.offeneAlerts ?? 0}            icon={<Activity size={20}/>}      color={b && b.offeneAlerts > 0 ? 'red' : 'teal'}/></Link>
            <Link to="/incidents"   className="block"><StatCard label="Kritische Vorfälle"      value={b?.kritischeVorfaelle ?? 0}      icon={<AlertTriangle size={20}/>}  color={b && b.kritischeVorfaelle > 0 ? 'red' : 'teal'}/></Link>
            <Link to="/devices"     className="block"><StatCard label="Defekte Geräte"          value={b?.geraeteDefekt ?? 0}           icon={<Cpu size={20}/>}           color={b && b.geraeteDefekt > 0 ? 'red' : 'teal'}/></Link>
            <Link to="/staff-docs"  className="block"><StatCard label="Dokumente ablaufend"     value={b?.fehlendeDokumente ?? 0}       icon={<FileCheck size={20}/>}     color={b && b.fehlendeDokumente > 0 ? 'yellow' : 'teal'}/></Link>
            <Link to="/handover"    className="block"><StatCard label="Offene Übergaben"        value={b?.offeneUebergaben ?? 0}        icon={<ArrowLeftRight size={20}/>} color="yellow"/></Link>
            <Link to="/hr"          className="block"><StatCard label="Krankmeldungen"          value={b?.aktiveKrankmeldungen ?? 0}    icon={<Heart size={20}/>}         color={b && b.aktiveKrankmeldungen > 0 ? 'orange' : 'teal'}/></Link>
            <Link to="/hr"          className="block"><StatCard label="Urlaubsanträge"          value={b?.offeneUrlaubsantraege ?? 0}   icon={<Calendar size={20}/>}      color={b && b.offeneUrlaubsantraege > 0 ? 'yellow' : 'teal'}/></Link>
            <Link to="/finance"     className="block"><StatCard label="Überfällige Rechnungen"  value={b?.ueberfaelligeRechnungen ?? 0} icon={<Euro size={20}/>}          color={b && b.ueberfaelligeRechnungen > 0 ? 'red' : 'teal'}/></Link>
            <Link to="/devices"     className="block"><StatCard label="Wartung fällig (7 Tage)" value={b?.wartungFaellig ?? 0}          icon={<Clock size={20}/>}         color={b && b.wartungFaellig > 0 ? 'orange' : 'teal'}/></Link>
            <Link to="/patients"    className="block"><StatCard label="Aktive Patienten"        value={b?.patienten?.length ?? 0}       icon={<Users size={20}/>}         color="teal"/></Link>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-charcoal text-lg mb-1">Häufig genutzte Aktionen</h2>
            <p className="text-sm text-charcoal-lighter mb-4">Klicken Sie auf eine Aktion, um direkt loszulegen.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: <Sparkles size={20}/>, label: '✨ Übergabebericht schreiben lassen', path: '/handover', color: 'bg-teal-500 text-white' },
                { icon: <BarChart2 size={20}/>, label: '📊 Vitalwerte eintragen', path: '/monitoring', color: 'bg-teal-50 text-teal-700 border border-teal-200' },
                { icon: <Upload size={20}/>, label: '📥 Dateien & Excel importieren', path: '/import', color: 'bg-teal-50 text-teal-700 border border-teal-200' },
                { icon: <FileText size={20}/>, label: '📋 Neuen Patienten anlegen', path: '/patients', color: 'bg-teal-50 text-teal-700 border border-teal-200' },
              ].map((a, i) => (
                <Link key={i} to={a.path} className={`flex items-center gap-3 p-4 rounded-xl font-medium text-sm hover:opacity-90 transition-opacity ${a.color}`}>
                  {a.icon} {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Module grid */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-bold text-charcoal text-lg mb-1">Was möchten Sie heute tun?</h2>
            <p className="text-sm text-charcoal-lighter mb-4">Klicken Sie auf einen Bereich, um direkt loszulegen.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {MODULES.map(m => (
                <Link key={m.path} to={m.path}
                  className="flex items-start gap-3 bg-gray-50 hover:bg-teal-50 border border-gray-100 hover:border-teal-300 rounded-xl p-4 transition-all group">
                  <span className="text-2xl flex-shrink-0">{m.icon}</span>
                  <div>
                    <p className="font-semibold text-sm text-charcoal group-hover:text-teal-700">{m.label}</p>
                    <p className="text-xs text-charcoal-lighter mt-0.5 leading-tight">{m.subtitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Open alerts panel */}
          {alertsData && alertsData.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-red-100">
              <div className="px-5 py-3 bg-red-50 border-b border-red-100">
                <h3 className="font-semibold text-red-700">🚨 Offene Meldungen — Bitte prüfen</h3>
                <p className="text-xs text-red-500 mt-0.5">Diese Meldungen wurden automatisch ausgelöst, weil ein Messwert außerhalb des Normalbereichs lag.</p>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Patient</th>
                    <th className="px-4 py-3 text-left">Messwert</th>
                    <th className="px-4 py-3 text-left">Wert</th>
                    <th className="px-4 py-3 text-left">Schweregrad</th>
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
                          {alert.alertLevel === 'ROT' ? '🔴 KRITISCH' : '🟡 WARNUNG'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
