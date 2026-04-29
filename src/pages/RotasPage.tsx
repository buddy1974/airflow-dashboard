import { useQuery } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import api from '../lib/api'

interface Shift {
  id: string; datum: string; schicht: string; status: string
  user?: { id: string; name: string }
  patient?: { id: string; vorname: string; nachname: string }
  startzeit: string; endzeit: string
}
interface Rota { id: string; wocheVom: string; wocheBis: string; status: string; shifts: Shift[] }

const DAYS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

export default function RotasPage() {
  const { data: rota, isLoading } = useQuery({
    queryKey: ['rota-current'],
    queryFn:  () => api.get<{ success: boolean; rota: Rota | null }>('/rotas/current').then(r => r.data.rota),
  })

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  if (!rota) return (
    <div>
      <PageHeader title="Dienstplan" subtitle="Aktuelle Woche"/>
      <div className="bg-white rounded-xl shadow-sm p-8 text-center text-charcoal-lighter">Kein aktiver Dienstplan gefunden</div>
    </div>
  )

  const weekDates: Date[] = []
  const start = new Date(rota.wocheVom)
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setUTCDate(d.getUTCDate() + i); weekDates.push(d)
  }

  // Group shifts by patient then day
  const patients = [...new Map((rota.shifts ?? []).filter(s => s.patient).map(s => [s.patient!.id, s.patient!])).values()]

  return (
    <div>
      <PageHeader
        title="Dienstplan"
        subtitle={`${new Date(rota.wocheVom).toLocaleDateString('de-DE')} – ${new Date(rota.wocheBis).toLocaleDateString('de-DE')} · ${rota.status}`}
      />
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Patient</th>
              {weekDates.map((d, i) => (
                <th key={i} className="px-3 py-3 text-center font-medium">
                  {DAYS_DE[i]}<br/>
                  <span className="text-charcoal">{d.getUTCDate()}.{d.getUTCMonth()+1}.</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {patients.map(patient => (
              <tr key={patient.id}>
                <td className="px-4 py-3 font-medium text-charcoal whitespace-nowrap">{patient.vorname} {patient.nachname}</td>
                {weekDates.map((d, i) => {
                  const dayStr = d.toISOString().split('T')[0]
                  const shifts = (rota.shifts ?? []).filter(s => s.patient?.id === patient.id && s.datum.startsWith(dayStr))
                  return (
                    <td key={i} className="px-2 py-2 text-center">
                      {shifts.map(s => (
                        <div key={s.id} className={`text-xs rounded p-1 mb-0.5 ${s.schicht === 'TAG' ? 'bg-teal-100 text-teal-700' : 'bg-charcoal text-white'}`}>
                          <div className="font-semibold">{s.schicht}</div>
                          <div className="truncate">{s.user?.name ?? '—'}</div>
                          <Badge status={s.status}/>
                        </div>
                      ))}
                    </td>
                  )
                })}
              </tr>
            ))}
            {!patients.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-charcoal-lighter">Keine Schichten geplant</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
