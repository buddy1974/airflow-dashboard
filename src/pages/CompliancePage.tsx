import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import api from '../lib/api'

interface ComplianceCheck {
  id: string; bezeichnung: string; beschreibung?: string; status: string
  faelligAm?: string; erledigtAm?: string; mdkRelevant: boolean; kategorie?: string; bemerkungen?: string
}
interface EditForm { bezeichnung: string; status: string; faelligAm: string; kategorie: string; bemerkungen: string }

const COMPLIANCE_STATUS = ['FAELLIG','KONFORM','UEBERFAELLIG','NICHT_ANWENDBAR']

export default function CompliancePage() {
  const [editItem, setEditItem] = useState<ComplianceCheck | null>(null)
  const [form, setForm] = useState<EditForm>({ bezeichnung: '', status: 'FAELLIG', faelligAm: '', kategorie: '', bemerkungen: '' })
  const queryClient = useQueryClient()

  const { data: mdkChecks, isLoading } = useQuery({
    queryKey: ['compliance-mdk'],
    queryFn:  () => api.get<{ success: boolean; checks: ComplianceCheck[] }>('/compliance/mdk').then(r => r.data.checks),
  })
  const { data: allChecks } = useQuery({
    queryKey: ['compliance-all'],
    queryFn:  () => api.get<{ success: boolean; checks: ComplianceCheck[] }>('/compliance').then(r => r.data.checks),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: EditForm) => api.put(`/compliance/${editItem!.id}`, { ...payload, faelligAm: payload.faelligAm ? new Date(payload.faelligAm).toISOString() : null }).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['compliance-mdk'] }); queryClient.invalidateQueries({ queryKey: ['compliance-all'] }); setEditItem(null) },
  })

  const openEdit = (c: ComplianceCheck) => {
    setEditItem(c)
    setForm({ bezeichnung: c.bezeichnung, status: c.status, faelligAm: c.faelligAm ? c.faelligAm.split('T')[0] : '', kategorie: c.kategorie ?? '', bemerkungen: c.bemerkungen ?? '' })
  }

  const total = allChecks?.length ?? 0
  const konform = allChecks?.filter(c => c.status === 'KONFORM').length ?? 0
  const pct = total > 0 ? Math.round((konform / total) * 100) : 0

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
  const F = (k: 'bezeichnung'|'status'|'faelligAm'|'kategorie'|'bemerkungen') => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value })) })

  return (
    <div>
      <PageHeader title="MDK Compliance" subtitle={`${konform} von ${total} Checks konform`} />
      <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium text-charcoal">Compliance-Rate</span>
          <span className={`font-bold ${pct >= 80 ? 'text-teal-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{pct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div className={`h-3 rounded-full transition-all ${pct >= 80 ? 'bg-teal-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${pct}%` }}/>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Bezeichnung</th>
              <th className="px-4 py-3 text-left">Kategorie</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Fällig</th>
              <th className="px-4 py-3 text-left">Erledigt</th>
              <th className="px-4 py-3"></th>
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
                <td className="px-4 py-3"><button onClick={() => openEdit(c)} className="text-charcoal-lighter hover:text-teal-600"><Pencil size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editItem && (
        <Modal title="Compliance-Check bearbeiten" onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div><label className="block text-xs font-medium text-charcoal mb-1">Bezeichnung</label><input {...F('bezeichnung')} className={cls}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Status</label><select {...F('status')} className={cls}>{COMPLIANCE_STATUS.map(v => <option key={v}>{v}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Fällig am</label><input type="date" {...F('faelligAm')} className={cls}/></div>
            </div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Kategorie</label><input {...F('kategorie')} className={cls}/></div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Bemerkungen</label><textarea {...F('bemerkungen')} rows={2} className={cls}/></div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditItem(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Abbrechen</button>
              <button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending} className="px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 disabled:opacity-50">{updateMutation.isPending ? 'Speichere…' : 'Speichern'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
