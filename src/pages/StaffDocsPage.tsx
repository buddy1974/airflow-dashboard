import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import api from '../lib/api'

interface StaffDoc {
  id: string; typ: string; bezeichnung: string; verifiziert: boolean
  ausstellungsdatum?: string; ablaufdatum?: string
  user?: { name: string }
}

function isExpiringSoon(date?: string): boolean {
  if (!date) return false
  const diff = new Date(date).getTime() - Date.now()
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000
}

export default function StaffDocsPage() {
  const { data: docs, isLoading } = useQuery({
    queryKey: ['staff-documents'],
    queryFn:  () => api.get<{ success: boolean; documents: StaffDoc[] }>('/staff-documents').then(r => r.data.documents),
  })
  const { data: expiring } = useQuery({
    queryKey: ['staff-documents-expiring'],
    queryFn:  () => api.get<{ success: boolean; documents: StaffDoc[] }>('/staff-documents/expiring').then(r => r.data.documents),
  })

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  return (
    <div>
      <PageHeader title="Personaldokumente" subtitle={`${docs?.length ?? 0} Dokumente`} />

      {expiring && expiring.length > 0 && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-orange-800">
          <AlertTriangle size={18} className="flex-shrink-0"/>
          <span><strong>{expiring.length}</strong> Dokument{expiring.length !== 1 ? 'e' : ''} laufen in den nächsten 30 Tagen ab</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Bezeichnung</th>
              <th className="px-4 py-3 text-left">Typ</th>
              <th className="px-4 py-3 text-left">Mitarbeiter</th>
              <th className="px-4 py-3 text-left">Ausgestellt</th>
              <th className="px-4 py-3 text-left">Ablaufdatum</th>
              <th className="px-4 py-3 text-left">Verifiziert</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(docs ?? []).map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-charcoal">{d.bezeichnung}</td>
                <td className="px-4 py-3"><Badge status={d.typ}/></td>
                <td className="px-4 py-3 text-charcoal-lighter">{d.user?.name ?? '—'}</td>
                <td className="px-4 py-3 text-charcoal-lighter">{d.ausstellungsdatum ? new Date(d.ausstellungsdatum).toLocaleDateString('de-DE') : '—'}</td>
                <td className={`px-4 py-3 font-medium ${isExpiringSoon(d.ablaufdatum) ? 'text-red-600' : 'text-charcoal-lighter'}`}>
                  {d.ablaufdatum ? new Date(d.ablaufdatum).toLocaleDateString('de-DE') : '—'}
                  {isExpiringSoon(d.ablaufdatum) && <span className="ml-1 text-xs text-red-500">⚠️</span>}
                </td>
                <td className="px-4 py-3">
                  {d.verifiziert
                    ? <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">✓ Ja</span>
                    : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Nein</span>}
                </td>
              </tr>
            ))}
            {!docs?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal-lighter">Keine Dokumente</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
