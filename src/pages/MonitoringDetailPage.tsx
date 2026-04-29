import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import api from '../lib/api'

interface MonEntry {
  id: string; recordedAt: string; herzfrequenz: number; atemfrequenz: number
  spo2: number; temperatur: number; alertLevel: string; alertTriggered: boolean
  blutdruckSys: number; blutdruckDia: number; bewusstsein: string; beatmungsmodus: string
}
interface MissingData { schicht: string; missingHours: number[] }
interface Patient { vorname: string; nachname: string; diagnoseHaupt: string }

const HOUR_COLORS: Record<string, string> = {
  GRUEN: 'bg-teal-400',
  GELB:  'bg-yellow-400',
  ROT:   'bg-red-500',
}

export default function MonitoringDetailPage() {
  const { id } = useParams<{ id: string }>()

  const { data: patient } = useQuery({
    queryKey: ['patient', id],
    queryFn:  () => api.get<{ success: boolean; patient: Patient }>(`/patients/${id}`).then(r => r.data.patient),
    enabled: !!id,
  })

  const { data: entries, isLoading } = useQuery({
    queryKey: ['monitoring-today', id],
    queryFn:  () => api.get<{ success: boolean; entries: MonEntry[] }>(`/monitoring/entries/patient/${id}/today`).then(r => r.data.entries),
    enabled: !!id,
    refetchInterval: 60000,
  })

  const { data: missingData } = useQuery({
    queryKey: ['monitoring-missing', id],
    queryFn:  () => api.get<{ success: boolean; data: MissingData }>(`/monitoring/patient/${id}/missing`).then(r => r.data.data),
    enabled: !!id,
  })

  const entryByHour = (entries ?? []).reduce<Record<number, MonEntry>>((acc, e) => {
    const h = new Date(e.recordedAt).getUTCHours()
    acc[h] = e
    return acc
  }, {})

  const allHours = Array.from({ length: 24 }, (_, i) => i)

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  return (
    <div>
      <div className="mb-4">
        <Link to="/monitoring" className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700">
          <ArrowLeft size={16}/> Zurück zum Monitoring
        </Link>
      </div>
      <PageHeader
        title={patient ? `${patient.vorname} ${patient.nachname}` : 'Patient'}
        subtitle={patient?.diagnoseHaupt}
      />

      {missingData && missingData.missingHours.length > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          ⚠️ Schicht: <strong>{missingData.schicht}</strong> · Fehlende Stunden: {missingData.missingHours.join(', ')} Uhr
        </div>
      )}

      {/* 24h Timeline */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-sm font-semibold text-charcoal-lighter uppercase tracking-wider mb-4">24-Stunden-Protokoll (Heute)</h3>
        <div className="grid grid-cols-12 gap-1.5">
          {allHours.map(h => {
            const e = entryByHour[h]
            return (
              <div key={h} title={e ? `${h}:00 — SpO2: ${e.spo2}%, HF: ${e.herzfrequenz}` : `${h}:00 — Kein Eintrag`}
                className={`h-12 rounded flex items-end justify-center pb-1 cursor-default transition-all hover:opacity-80 ${e ? HOUR_COLORS[e.alertLevel] ?? 'bg-teal-400' : 'bg-gray-100 border border-dashed border-gray-300'}`}
              >
                <span className={`text-xs font-medium ${e ? 'text-white' : 'text-gray-400'}`}>{h}</span>
              </div>
            )
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-charcoal-lighter">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal-400 inline-block"/>GRUEN</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-400 inline-block"/>GELB</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block"/>ROT</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 border border-dashed border-gray-300 inline-block"/>Fehlend</span>
        </div>
      </div>

      {/* Entries table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Uhrzeit</th>
              <th className="px-4 py-3 text-left">HF</th>
              <th className="px-4 py-3 text-left">AF</th>
              <th className="px-4 py-3 text-left">SpO2</th>
              <th className="px-4 py-3 text-left">RR</th>
              <th className="px-4 py-3 text-left">Temp.</th>
              <th className="px-4 py-3 text-left">Bewusstsein</th>
              <th className="px-4 py-3 text-left">Alert</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(entries ?? []).map(e => (
              <tr key={e.id} className={`hover:bg-gray-50 ${e.alertTriggered ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-2.5 font-medium">{new Date(e.recordedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-4 py-2.5">{e.herzfrequenz}</td>
                <td className="px-4 py-2.5">{e.atemfrequenz}</td>
                <td className="px-4 py-2.5 font-semibold">{e.spo2}%</td>
                <td className="px-4 py-2.5">{e.blutdruckSys}/{e.blutdruckDia}</td>
                <td className="px-4 py-2.5">{e.temperatur}°C</td>
                <td className="px-4 py-2.5">{e.bewusstsein}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    e.alertLevel === 'ROT' ? 'bg-red-100 text-red-700' :
                    e.alertLevel === 'GELB' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-teal-100 text-teal-700'
                  }`}>{e.alertLevel}</span>
                </td>
              </tr>
            ))}
            {!entries?.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-charcoal-lighter">Noch keine Einträge heute</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
