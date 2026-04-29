import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import api from '../lib/api'

interface TrainingRecord {
  id: string; bezeichnung: string; anbieter?: string; status: string
  gueltigBis?: string; pflichtschulung: boolean; abgeschlossenAm?: string
  user?: { name: string }
}
interface EditForm { bezeichnung: string; anbieter: string; status: string; gueltigBis: string; pflichtschulung: boolean }

const TRAINING_STATUS = ['AUSSTEHEND','ABGESCHLOSSEN','ABGELAUFEN']

export default function TrainingPage() {
  const [editItem, setEditItem] = useState<TrainingRecord | null>(null)
  const [form, setForm] = useState<EditForm>({ bezeichnung: '', anbieter: '', status: 'AUSSTEHEND', gueltigBis: '', pflichtschulung: false })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['training'],
    queryFn:  () => api.get<{ success: boolean; records: TrainingRecord[] }>('/training').then(r => r.data.records),
  })
  const { data: overdue } = useQuery({
    queryKey: ['training-overdue'],
    queryFn:  () => api.get<{ success: boolean; records: TrainingRecord[] }>('/training/overdue').then(r => r.data.records),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: EditForm) => api.put(`/training/${editItem!.id}`, { ...payload, gueltigBis: payload.gueltigBis ? new Date(payload.gueltigBis).toISOString() : null }).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['training'] }); setEditItem(null) },
  })

  const openEdit = (r: TrainingRecord) => {
    setEditItem(r)
    setForm({ bezeichnung: r.bezeichnung, anbieter: r.anbieter ?? '', status: r.status, gueltigBis: r.gueltigBis ? r.gueltigBis.split('T')[0] : '', pflichtschulung: r.pflichtschulung })
  }

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
  const F = (k: 'bezeichnung'|'anbieter'|'status'|'gueltigBis') => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement>) => setForm(f => ({ ...f, [k]: e.target.value })) })

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
              <th className="px-4 py-3"></th>
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
                <td className={`px-4 py-3 ${r.gueltigBis && new Date(r.gueltigBis) < new Date() ? 'text-red-600 font-semibold' : 'text-charcoal-lighter'}`}>{r.gueltigBis ? new Date(r.gueltigBis).toLocaleDateString('de-DE') : '—'}</td>
                <td className="px-4 py-3"><button onClick={() => openEdit(r)} className="text-charcoal-lighter hover:text-teal-600"><Pencil size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editItem && (
        <Modal title="Schulung bearbeiten" onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div><label className="block text-xs font-medium text-charcoal mb-1">Bezeichnung</label><input {...F('bezeichnung')} className={cls}/></div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Anbieter</label><input {...F('anbieter')} className={cls}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Status</label><select {...F('status')} className={cls}>{TRAINING_STATUS.map(v => <option key={v}>{v}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Gültig bis</label><input type="date" {...F('gueltigBis')} className={cls}/></div>
            </div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.pflichtschulung} onChange={e => setForm(f => ({ ...f, pflichtschulung: e.target.checked }))} className="accent-teal-500"/> Pflichtschulung</label>
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
