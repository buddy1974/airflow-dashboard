import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import api from '../lib/api'

interface UrlaubAntrag   { id: string; vonDatum: string; bisDatum: string; tage: number; status: string; grund?: string; user?: { name: string } }
interface Krankmeldung   { id: string; vonDatum: string; bisDatum?: string; status: string; diagnose?: string; attest: boolean; user?: { name: string } }
interface QualUser       { id: string; name: string; qualifikationen: { id: string; typ: string; bestaetigt: boolean; gueltigBis?: string }[] }

export default function HrPage() {
  const [tab, setTab] = useState<'urlaub' | 'krank' | 'matrix'>('urlaub')

  const { data: urlaub } = useQuery({
    queryKey: ['hr-urlaub'],
    queryFn:  () => api.get<{ success: boolean; antraege: UrlaubAntrag[] }>('/hr/urlaub').then(r => r.data.antraege),
    enabled: tab === 'urlaub',
  })
  const { data: krank } = useQuery({
    queryKey: ['hr-krank'],
    queryFn:  () => api.get<{ success: boolean; krankmeldungen: Krankmeldung[] }>('/hr/krankmeldungen').then(r => r.data.krankmeldungen),
    enabled: tab === 'krank',
  })
  const { data: matrix } = useQuery({
    queryKey: ['hr-matrix'],
    queryFn:  () => api.get<{ success: boolean; users: QualUser[] }>('/hr/qualifikationen/matrix').then(r => r.data.users),
    enabled: tab === 'matrix',
  })

  const QUAL_TYPES = ['BEATMUNGSPFLEGE', 'TRACHEOSTOMA', 'BTM_BERECHTIGUNG', 'WUNDVERSORGUNG', 'ERSTE_HILFE', 'HYGIENE']

  return (
    <div>
      <PageHeader title="HR" subtitle="Urlaub · Krankmeldungen · Qualifikationsmatrix" />

      <div className="flex gap-2 mb-6">
        {(['urlaub', 'krank', 'matrix'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-teal-500 text-white' : 'bg-white text-charcoal border border-gray-200 hover:border-teal-300'}`}>
            {t === 'urlaub' ? 'Urlaubsanträge' : t === 'krank' ? 'Krankmeldungen' : 'Qualifikationsmatrix'}
          </button>
        ))}
      </div>

      {tab === 'urlaub' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Mitarbeiter</th>
                <th className="px-4 py-3 text-left">Von</th>
                <th className="px-4 py-3 text-left">Bis</th>
                <th className="px-4 py-3 text-left">Tage</th>
                <th className="px-4 py-3 text-left">Grund</th>
                <th className="px-4 py-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(urlaub ?? []).map(a => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{a.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-charcoal-lighter">{new Date(a.vonDatum).toLocaleDateString('de-DE')}</td>
                  <td className="px-4 py-3 text-charcoal-lighter">{new Date(a.bisDatum).toLocaleDateString('de-DE')}</td>
                  <td className="px-4 py-3 font-semibold text-teal-600">{a.tage}</td>
                  <td className="px-4 py-3 text-charcoal-lighter">{a.grund ?? '—'}</td>
                  <td className="px-4 py-3"><Badge status={a.status}/></td>
                </tr>
              ))}
              {!urlaub?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal-lighter">Keine Urlaubsanträge</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'krank' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Mitarbeiter</th>
                <th className="px-4 py-3 text-left">Von</th>
                <th className="px-4 py-3 text-left">Bis</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Diagnose</th>
                <th className="px-4 py-3 text-left">Attest</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(krank ?? []).map(k => (
                <tr key={k.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{k.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-charcoal-lighter">{new Date(k.vonDatum).toLocaleDateString('de-DE')}</td>
                  <td className="px-4 py-3 text-charcoal-lighter">{k.bisDatum ? new Date(k.bisDatum).toLocaleDateString('de-DE') : 'Laufend'}</td>
                  <td className="px-4 py-3"><Badge status={k.status}/></td>
                  <td className="px-4 py-3 text-charcoal-lighter">{k.diagnose ?? '—'}</td>
                  <td className="px-4 py-3">{k.attest ? <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">Ja</span> : '—'}</td>
                </tr>
              ))}
              {!krank?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal-lighter">Keine Krankmeldungen</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'matrix' && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 text-xs text-charcoal-lighter">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Mitarbeiter</th>
                {QUAL_TYPES.map(q => (
                  <th key={q} className="px-3 py-3 text-center font-medium text-xs">{q.replace('_', ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(matrix ?? []).map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-charcoal">{u.name}</td>
                  {QUAL_TYPES.map(qt => {
                    const q = u.qualifikationen.find(q2 => q2.typ === qt)
                    return (
                      <td key={qt} className="px-3 py-3 text-center">
                        {q ? (
                          <span className={`text-sm ${q.bestaetigt ? 'text-teal-500' : 'text-yellow-500'}`}>
                            {q.bestaetigt ? '✓' : '○'}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                    )
                  })}
                </tr>
              ))}
              {!matrix?.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-charcoal-lighter">Keine Daten</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
