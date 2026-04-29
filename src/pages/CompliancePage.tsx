import { useQuery } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import api from '../lib/api'

interface ComplianceCheck {
  id: string; bezeichnung: string; beschreibung?: string; status: string
  faelligAm?: string; erledigtAm?: string; mdkRelevant: boolean; kategorie?: string
}

export default function CompliancePage() {
  const { data: mdkChecks, isLoading } = useQuery({
    queryKey: ['compliance-mdk'],
    queryFn:  () => api.get<{ success: boolean; checks: ComplianceCheck[] }>('/compliance/mdk').then(r => r.data.checks),
  })
  const { data: allChecks } = useQuery({
    queryKey: ['compliance-all'],
    queryFn:  () => api.get<{ success: boolean; checks: ComplianceCheck[] }>('/compliance').then(r => r.data.checks),
  })

  const total   = allChecks?.length ?? 0
  const konform = allChecks?.filter(c => c.status === 'KONFORM').length ?? 0
  const pct     = total > 0 ? Math.round((konform / total) * 100) : 0

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  return (
    <div>
      <PageHeader title="MDK Compliance" subtitle={`${konform} von ${total} Checks konform`} />

      {/* Progress bar */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-charcoal">Compliance-Rate</span>
          <span className={`font-bold ${pct >= 80 ? 'text-teal-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${pct >= 80 ? 'bg-teal-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-500'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <h3 className="text-sm font-semibold text-charcoal-lighter uppercase tracking-wider mb-3">MDK-relevante Prüfungen</h3>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Bezeichnung</th>
              <th className="px-4 py-3 text-left">Kategorie</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Fällig</th>
              <th className="px-4 py-3 text-left">Erledigt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(mdkChecks ?? []).map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-charcoal">{c.bezeichnung}</td>
                <td className="px-4 py-3 text-charcoal-lighter">{c.kategorie ?? '—'}</td>
                <td className="px-4 py-3"><Badge status={c.status}/></td>
                <td className="px-4 py-3 text-charcoal-lighter">{c.faelligAm ? new Date(c.faelligAm).toLocaleDateString('de-DE') : '—'}</td>
                <td className="px-4 py-3 text-charcoal-lighter">{c.erledigtAm ? new Date(c.erledigtAm).toLocaleDateString('de-DE') : '—'}</td>
              </tr>
            ))}
            {!mdkChecks?.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-charcoal-lighter">Keine Compliance-Checks</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
