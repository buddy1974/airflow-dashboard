import { useQuery } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import api from '../lib/api'

interface Handover {
  id: string; schicht: string; schichtDatum: string; status: string; dringend: boolean
  zusammenfassung: string; offenePunkte?: string
  patient?: { vorname: string; nachname: string }
}

export default function HandoverPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['handovers-open'],
    queryFn:  () => api.get<{ success: boolean; handovers: Handover[] }>('/handover/open').then(r => r.data.handovers),
  })

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  return (
    <div>
      <PageHeader title="Schichtübergabe" subtitle={`${data?.length ?? 0} offene Übergaben`} />
      <div className="space-y-4">
        {(data ?? []).map(h => (
          <div key={h.id} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${h.dringend ? 'border-red-500' : 'border-teal-400'}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="font-semibold text-charcoal">{h.patient ? `${h.patient.vorname} ${h.patient.nachname}` : '—'}</span>
                {h.dringend && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">DRINGEND</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-charcoal-lighter">{new Date(h.schichtDatum).toLocaleDateString('de-DE')} · {h.schicht}</span>
                <Badge status={h.status}/>
              </div>
            </div>
            <p className="text-sm text-charcoal">{h.zusammenfassung}</p>
            {h.offenePunkte && <p className="text-xs text-orange-700 mt-2 bg-orange-50 px-3 py-2 rounded">⚠️ Offene Punkte: {h.offenePunkte}</p>}
          </div>
        ))}
        {!data?.length && <div className="bg-white rounded-xl shadow-sm p-8 text-center text-charcoal-lighter">Keine offenen Übergaben</div>}
      </div>
    </div>
  )
}
