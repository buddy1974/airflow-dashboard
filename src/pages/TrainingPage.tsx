import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import api from '../lib/api'

interface TrainingRecord {
  id: string; bezeichnung: string; anbieter?: string; status: string
  gueltigBis?: string; pflichtschulung: boolean; abgeschlossenAm?: string
  user?: { name: string }
}

export default function TrainingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['training'],
    queryFn:  () => api.get<{ success: boolean; records: TrainingRecord[] }>('/training').then(r => r.data.records),
  })
  const { data: overdue } = useQuery({
    queryKey: ['training-overdue'],
    queryFn:  () => api.get<{ success: boolean; records: TrainingRecord[] }>('/training/overdue').then(r => r.data.records),
  })

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  return (
    <div>
      <PageHeader title="Schulungen" subtitle={`${data?.length ?? 0} Schulungsnachweise`} />

      {overdue && overdue.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-red-800">
          <AlertTriangle size={18} className="flex-shrink-0"/>
          <span><strong>{overdue.length}</strong> abgelaufene Schulung{overdue.length !== 1 ? 'en' : ''}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Schulung</th>
              <th className="px-4 py-3 text-left">Mitarbeiter</th>
              <th className="px-4 py-3 text-left">Anbieter</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Pflicht</th>
              <th className="px-4 py-3 text-left">Gültig bis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data ?? []).map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-charcoal">{r.bezeichnung}</td>
                <td className="px-4 py-3">{r.user?.name ?? '—'}</td>
                <td className="px-4 py-3 text-charcoal-lighter">{r.anbieter ?? '—'}</td>
                <td className="px-4 py-3"><Badge status={r.status}/></td>
                <td className="px-4 py-3">{r.pflichtschulung ? <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Ja</span> : '—'}</td>
                <td className={`px-4 py-3 ${r.gueltigBis && new Date(r.gueltigBis) < new Date() ? 'text-red-600 font-semibold' : 'text-charcoal-lighter'}`}>
                  {r.gueltigBis ? new Date(r.gueltigBis).toLocaleDateString('de-DE') : '—'}
                </td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal-lighter">Keine Schulungen</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
