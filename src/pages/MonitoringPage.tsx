import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import api from '../lib/api'

interface Patient { id: string; vorname: string; nachname: string; diagnoseHaupt: string; status: string }
interface Alert    { id: string; parameter: string; wert: string; alertLevel: string; patient?: { vorname: string; nachname: string }; createdAt: string }
interface LatestEntry { alertLevel: string }

function AlertBorder({ level }: { level?: string }) {
  if (level === 'ROT')  return 'border-l-4 border-red-500'
  if (level === 'GELB') return 'border-l-4 border-yellow-400'
  return 'border-l-4 border-teal-400'
}

export default function MonitoringPage() {
  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients-aktiv'],
    queryFn:  () => api.get<{ success: boolean; patients: Patient[] }>('/patients?status=AKTIV').then(r => r.data.patients),
    refetchInterval: 60000,
  })

  const { data: alerts } = useQuery({
    queryKey: ['monitoring-alerts-open'],
    queryFn:  () => api.get<{ success: boolean; alerts: Alert[] }>('/monitoring/alerts/open').then(r => r.data.alerts),
    refetchInterval: 60000,
  })

  // Fetch latest entry per patient
  const latestEntries = useQuery({
    queryKey: ['monitoring-latest-entries', patients?.map(p => p.id)],
    queryFn:  async () => {
      if (!patients?.length) return {} as Record<string, string>
      const results = await Promise.allSettled(
        patients.map(p => api.get<{ success: boolean; entry: LatestEntry | null }>(`/monitoring/entries/patient/${p.id}/latest`).then(r => ({ id: p.id, level: r.data.entry?.alertLevel ?? 'GRUEN' })))
      )
      const map: Record<string, string> = {}
      results.forEach(r => { if (r.status === 'fulfilled') map[r.value.id] = r.value.level })
      return map
    },
    enabled: !!patients?.length,
    refetchInterval: 60000,
  })

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  return (
    <div>
      <PageHeader title="Monitoring" subtitle="Überwachungsprotokoll — aktualisiert alle 60 Sek." />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Patient cards */}
        <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(patients ?? []).map(p => {
            const level = latestEntries.data?.[p.id] ?? 'GRUEN'
            return (
              <Link
                key={p.id}
                to={`/monitoring/${p.id}`}
                className={`bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow ${AlertBorder({ level })}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-charcoal">{p.vorname} {p.nachname}</p>
                    <p className="text-xs text-charcoal-lighter mt-0.5 line-clamp-2">{p.diagnoseHaupt}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    level === 'ROT' ? 'bg-red-100 text-red-700' :
                    level === 'GELB' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-teal-100 text-teal-700'
                  }`}>{level}</span>
                </div>
                <p className="text-xs text-teal-600 mt-3">→ Protokoll öffnen</p>
              </Link>
            )
          })}
          {!patients?.length && <p className="col-span-2 text-center text-charcoal-lighter py-8">Keine aktiven Patienten</p>}
        </div>

        {/* Alerts panel */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b bg-red-50">
            <h3 className="font-semibold text-sm text-red-700">Offene Alerts ({alerts?.length ?? 0})</h3>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {!alerts?.length ? (
              <p className="p-6 text-center text-sm text-teal-600">Keine offenen Alerts ✓</p>
            ) : alerts.map(a => (
              <div key={a.id} className="px-4 py-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">{a.parameter}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    a.alertLevel === 'ROT' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{a.alertLevel}</span>
                </div>
                <p className="text-xs text-charcoal-lighter">{a.patient ? `${a.patient.vorname} ${a.patient.nachname}` : '—'} · Wert: {a.wert}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
