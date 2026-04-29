import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import api from '../lib/api'

interface UrlaubAntrag   { id: string; vonDatum: string; bisDatum: string; tage: number; status: string; grund?: string; bemerkungen?: string; user?: { name: string } }
interface Krankmeldung   { id: string; vonDatum: string; bisDatum?: string; status: string; diagnose?: string; attest: boolean; user?: { name: string } }
interface QualUser       { id: string; name: string; qualifikationen: { id: string; typ: string; bestaetigt: boolean; gueltigBis?: string }[] }
interface EditUrlaubForm { grund: string; bemerkungen: string }
interface EditPAForm     { wochenstunden: string; urlaubstageJahr: string; resturlaub: string; tarifgruppe: string; notizen: string }

export default function HrPage() {
  const [tab, setTab] = useState<'urlaub' | 'krank' | 'matrix'>('urlaub')
  const [editUrlaub, setEditUrlaub] = useState<UrlaubAntrag | null>(null)
  const [editPA, setEditPA] = useState<string | null>(null) // userId
  const [urlaubForm, setUrlaubForm] = useState<EditUrlaubForm>({ grund: '', bemerkungen: '' })
  const [paForm, setPaForm] = useState<EditPAForm>({ wochenstunden: '', urlaubstageJahr: '28', resturlaub: '0', tarifgruppe: '', notizen: '' })
  const queryClient = useQueryClient()

  const { data: urlaub } = useQuery({ queryKey: ['hr-urlaub'], queryFn: () => api.get<{ success: boolean; antraege: UrlaubAntrag[] }>('/hr/urlaub').then(r => r.data.antraege), enabled: tab === 'urlaub' })
  const { data: krank } = useQuery({ queryKey: ['hr-krank'], queryFn: () => api.get<{ success: boolean; krankmeldungen: Krankmeldung[] }>('/hr/krankmeldungen').then(r => r.data.krankmeldungen), enabled: tab === 'krank' })
  const { data: matrix } = useQuery({ queryKey: ['hr-matrix'], queryFn: () => api.get<{ success: boolean; users: QualUser[] }>('/hr/qualifikationen/matrix').then(r => r.data.users), enabled: tab === 'matrix' })

  const updateUrlaubMutation = useMutation({
    mutationFn: (payload: EditUrlaubForm) => api.put(`/hr/urlaub/${editUrlaub!.id}`, payload).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['hr-urlaub'] }); setEditUrlaub(null) },
  })
  const updatePAMutation = useMutation({
    mutationFn: (payload: EditPAForm) => api.put(`/hr/personalakte/${editPA}`, {
      wochenstunden:   parseFloat(payload.wochenstunden) || null,
      urlaubstageJahr: parseInt(payload.urlaubstageJahr),
      resturlaub:      parseInt(payload.resturlaub),
      tarifgruppe:     payload.tarifgruppe || null,
      notizen:         payload.notizen || null,
    }).then(r => r.data),
    onSuccess: () => { setEditPA(null) },
  })

  const openEditUrlaub = (a: UrlaubAntrag) => { setEditUrlaub(a); setUrlaubForm({ grund: a.grund ?? '', bemerkungen: a.bemerkungen ?? '' }) }
  const openEditPA = (userId: string, u: QualUser) => { setEditPA(userId); setPaForm({ wochenstunden: '', urlaubstageJahr: '28', resturlaub: '0', tarifgruppe: '', notizen: '' }) }

  const QUAL_TYPES = ['BEATMUNGSPFLEGE','TRACHEOSTOMA','BTM_BERECHTIGUNG','WUNDVERSORGUNG','ERSTE_HILFE','HYGIENE']
  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"

  return (
    <div>
      <PageHeader title="HR" subtitle="Urlaub · Krankmeldungen · Qualifikationsmatrix" />
      <div className="flex flex-wrap gap-2 mb-6">
        {(['urlaub', 'krank', 'matrix'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-teal-500 text-white' : 'bg-white text-charcoal border border-gray-200 hover:border-teal-300'}`}>
            {t === 'urlaub' ? 'Urlaubsanträge' : t === 'krank' ? 'Krankmeldungen' : 'Qualifikationsmatrix'}
          </button>
        ))}
      </div>

      {tab === 'urlaub' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
              <tr><th className="px-4 py-3 text-left">Mitarbeiter</th><th className="px-4 py-3 text-left">Von</th><th className="px-4 py-3 text-left">Bis</th><th className="px-4 py-3 text-left">Tage</th><th className="px-4 py-3 text-left">Grund</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3"></th></tr>
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
                  <td className="px-4 py-3">{a.status === 'BEANTRAGT' && <button onClick={() => openEditUrlaub(a)} className="text-charcoal-lighter hover:text-teal-600"><Pencil size={14}/></button>}</td>
                </tr>
              ))}
              {!urlaub?.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-charcoal-lighter">Keine Urlaubsanträge</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {tab === 'krank' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
              <tr><th className="px-4 py-3 text-left">Mitarbeiter</th><th className="px-4 py-3 text-left">Von</th><th className="px-4 py-3 text-left">Bis</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-left">Diagnose</th><th className="px-4 py-3 text-left">Attest</th></tr>
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
        </div>
      )}

      {tab === 'matrix' && (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 text-xs text-charcoal-lighter">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Mitarbeiter</th>
                {QUAL_TYPES.map(q => <th key={q} className="px-3 py-3 text-center font-medium text-xs">{q.replace('_',' ')}</th>)}
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(matrix ?? []).map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-charcoal">{u.name}</td>
                  {QUAL_TYPES.map(qt => { const q = u.qualifikationen.find(q2 => q2.typ === qt); return <td key={qt} className="px-3 py-3 text-center">{q ? <span className={`text-sm ${q.bestaetigt ? 'text-teal-500' : 'text-yellow-500'}`}>{q.bestaetigt ? '✓' : '○'}</span> : <span className="text-gray-300">—</span>}</td> })}
                  <td className="px-4 py-3"><button onClick={() => openEditPA(u.id, u)} className="text-charcoal-lighter hover:text-teal-600"><Pencil size={14}/></button></td>
                </tr>
              ))}
              {!matrix?.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-charcoal-lighter">Keine Daten</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {editUrlaub && (
        <Modal title="Urlaubsantrag bearbeiten" onClose={() => setEditUrlaub(null)}>
          <div className="space-y-3">
            <div><label className="block text-xs font-medium text-charcoal mb-1">Grund</label><input value={urlaubForm.grund} onChange={e => setUrlaubForm(f => ({ ...f, grund: e.target.value }))} className={cls}/></div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Bemerkungen</label><textarea value={urlaubForm.bemerkungen} onChange={e => setUrlaubForm(f => ({ ...f, bemerkungen: e.target.value }))} rows={2} className={cls}/></div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditUrlaub(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Abbrechen</button>
              <button onClick={() => updateUrlaubMutation.mutate(urlaubForm)} disabled={updateUrlaubMutation.isPending} className="px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 disabled:opacity-50">{updateUrlaubMutation.isPending ? 'Speichere…' : 'Speichern'}</button>
            </div>
          </div>
        </Modal>
      )}

      {editPA && (
        <Modal title="Personalakte bearbeiten" onClose={() => setEditPA(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Wochenstunden</label><input type="number" value={paForm.wochenstunden} onChange={e => setPaForm(f => ({ ...f, wochenstunden: e.target.value }))} className={cls}/></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Urlaubstage/Jahr</label><input type="number" value={paForm.urlaubstageJahr} onChange={e => setPaForm(f => ({ ...f, urlaubstageJahr: e.target.value }))} className={cls}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Resturlaub</label><input type="number" value={paForm.resturlaub} onChange={e => setPaForm(f => ({ ...f, resturlaub: e.target.value }))} className={cls}/></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Tarifgruppe</label><input value={paForm.tarifgruppe} onChange={e => setPaForm(f => ({ ...f, tarifgruppe: e.target.value }))} className={cls}/></div>
            </div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Notizen</label><textarea value={paForm.notizen} onChange={e => setPaForm(f => ({ ...f, notizen: e.target.value }))} rows={2} className={cls}/></div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditPA(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Abbrechen</button>
              <button onClick={() => updatePAMutation.mutate(paForm)} disabled={updatePAMutation.isPending} className="px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 disabled:opacity-50">{updatePAMutation.isPending ? 'Speichere…' : 'Speichern'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
