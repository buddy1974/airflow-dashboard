import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, Cpu, FileCheck, ArrowLeftRight, Heart, Calendar, Euro, Clock, Users } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import api from '../lib/api'

interface Briefing {
  datum: string
  offeneAlerts: number
  kritischeVorfaelle: number
  geraeteDefekt: number
  fehlendeDokumente: number
  offeneUebergaben: number
  aktiveKrankmeldungen: number
  offeneUrlaubsantraege: number
  ueberfaelligeRechnungen: number
  wartungFaellig: number
  patienten: { id: string; vorname: string; nachname: string; beatmungspflichtig: boolean; status: string }[]
}

interface AlertItem {
  id: string
  parameter: string
  wert: string
  alertLevel: string
  patient?: { vorname: string; nachname: string }
  createdAt: string
}

const MODULES = [
  { label: 'PDL Büro',       path: '/pdl-office',  color: 'bg-teal-500' },
  { label: 'Dashboard',      path: '/dashboard',   color: 'bg-teal-600' },
  { label: 'Patienten',      path: '/patients',    color: 'bg-teal-500' },
  { label: 'Monitoring',     path: '/monitoring',  color: 'bg-red-500' },
  { label: 'Geräte',         path: '/devices',     color: 'bg-teal-600' },
  { label: 'Übergabe',       path: '/handover',    color: 'bg-teal-500' },
  { label: 'Vorfälle',       path: '/incidents',   color: 'bg-orange-500' },
  { label: 'Pflegepläne',    path: '/care-plans',  color: 'bg-teal-600' },
  { label: 'Medikamente',    path: '/medications', color: 'bg-teal-500' },
  { label: 'Dienstplan',     path: '/rotas',       color: 'bg-teal-600' },
  { label: 'Finanzen',       path: '/finance',     color: 'bg-teal-500' },
  { label: 'Gehaltsabr.',    path: '/payroll',     color: 'bg-teal-600' },
  { label: 'Schulungen',     path: '/training',    color: 'bg-teal-500' },
  { label: 'Bewerbungen',    path: '/recruitment', color: 'bg-teal-600' },
  { label: 'MDK Compliance', path: '/compliance',  color: 'bg-orange-500' },
  { label: 'Dokumente',      path: '/staff-docs',  color: 'bg-teal-500' },
  { label: 'HR',             path: '/hr',          color: 'bg-teal-600' },
  { label: 'Benutzer',       path: '/users',       color: 'bg-charcoal' },
]

export default function PdlOnboardingPage() {
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

  return (
    <div>
      <PageHeader
        title={`Guten Morgen, R. Koroma`}
        subtitle={b ? `Tagesbriefing · ${b.datum}` : 'Tagesbriefing wird geladen…'}
      />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* Stat grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
            <StatCard label="Offene Alerts"        value={b?.offeneAlerts ?? 0}           icon={<Activity size={20} />}     color={b && b.offeneAlerts > 0 ? 'red' : 'teal'} />
            <StatCard label="Kritische Vorfälle"   value={b?.kritischeVorfaelle ?? 0}     icon={<AlertTriangle size={20} />} color={b && b.kritischeVorfaelle > 0 ? 'red' : 'teal'} />
            <StatCard label="Defekte Geräte"       value={b?.geraeteDefekt ?? 0}          icon={<Cpu size={20} />}          color={b && b.geraeteDefekt > 0 ? 'red' : 'teal'} />
            <StatCard label="Dokumente ablaufend"  value={b?.fehlendeDokumente ?? 0}      icon={<FileCheck size={20} />}    color={b && b.fehlendeDokumente > 0 ? 'yellow' : 'teal'} />
            <StatCard label="Offene Übergaben"     value={b?.offeneUebergaben ?? 0}       icon={<ArrowLeftRight size={20} />} color="yellow" />
            <StatCard label="Krankmeldungen"       value={b?.aktiveKrankmeldungen ?? 0}   icon={<Heart size={20} />}        color={b && b.aktiveKrankmeldungen > 0 ? 'orange' : 'teal'} />
            <StatCard label="Urlaubsanträge"       value={b?.offeneUrlaubsantraege ?? 0}  icon={<Calendar size={20} />}     color="yellow" />
            <StatCard label="Überfällige Rechnungen" value={b?.ueberfaelligeRechnungen ?? 0} icon={<Euro size={20} />}     color={b && b.ueberfaelligeRechnungen > 0 ? 'red' : 'teal'} />
            <StatCard label="Wartung fällig"       value={b?.wartungFaellig ?? 0}         icon={<Clock size={20} />}        color={b && b.wartungFaellig > 0 ? 'orange' : 'teal'} />
            <StatCard label="Aktive Patienten"     value={b?.patienten?.length ?? 0}      icon={<Users size={20} />}        color="teal" />
          </div>

          {/* Module grid */}
          <h2 className="text-sm font-semibold text-charcoal-lighter uppercase tracking-wider mb-3">Module</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 mb-8">
            {MODULES.map(m => (
              <Link
                key={m.path}
                to={m.path}
                className={`${m.color} text-white rounded-xl p-4 text-center text-sm font-medium hover:opacity-90 transition-opacity`}
              >
                {m.label}
              </Link>
            ))}
          </div>

          {/* Open alerts panel */}
          <h2 className="text-sm font-semibold text-charcoal-lighter uppercase tracking-wider mb-3">Letzte offene Alerts</h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {!alertsData || alertsData.length === 0 ? (
              <div className="p-6 text-center text-charcoal-lighter text-sm">Keine offenen Alerts</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left">Patient</th>
                    <th className="px-4 py-3 text-left">Parameter</th>
                    <th className="px-4 py-3 text-left">Wert</th>
                    <th className="px-4 py-3 text-left">Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {alertsData.slice(0, 5).map(alert => (
                    <tr key={alert.id}>
                      <td className="px-4 py-3 font-medium">
                        {alert.patient ? `${alert.patient.vorname} ${alert.patient.nachname}` : '—'}
                      </td>
                      <td className="px-4 py-3">{alert.parameter}</td>
                      <td className="px-4 py-3">{alert.wert}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                          alert.alertLevel === 'ROT' ? 'bg-red-100 text-red-700' :
                          alert.alertLevel === 'GELB' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-teal-100 text-teal-700'
                        }`}>{alert.alertLevel}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}
