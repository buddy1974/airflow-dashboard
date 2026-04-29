import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import api from '../lib/api'

interface StaffDoc {
  id: string; typ: string; bezeichnung: string; verifiziert: boolean
  ausstellungsdatum?: string; ablaufdatum?: string; dokumentUrl?: string; bemerkungen?: string
  user?: { name: string }
}
interface EditForm { bezeichnung: string; typ: string; ablaufdatum: string; dokumentUrl: string; bemerkungen: string }

const DOC_TYPES = ['FUEHRUNGSZEUGNIS','AUSBILDUNGSNACHWEIS','IMPFNACHWEIS','ARBEITSVERTRAG','QUALIFIKATION','SONSTIGES']

function isExpiringSoon(date?: string): boolean {
  if (!date) return false
  const diff = new Date(date).getTime() - Date.now()
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000
}

export default function StaffDocsPage() {
  const [editItem, setEditItem] = useState<StaffDoc | null>(null)
  const [form, setForm] = useState<EditForm>({ bezeichnung: '', typ: 'SONSTIGES', ablaufdatum: '', dokumentUrl: '', bemerkungen: '' })
  const queryClient = useQueryClient()

  const { data: docs, isLoading } = useQuery({
    queryKey: ['staff-documents'],
    queryFn:  () => api.get<{ success: boolean; documents: StaffDoc[] }>('/staff-documents').then(r => r.data.documents),
  })
  const { data: expiring } = useQuery({
    queryKey: ['staff-documents-expiring'],
    queryFn:  () => api.get<{ success: boolean; documents: StaffDoc[] }>('/staff-documents/expiring').then(r => r.data.documents),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: EditForm) => api.put(`/staff-documents/${editItem!.id}`, { ...payload, ablaufdatum: payload.ablaufdatum ? new Date(payload.ablaufdatum).toISOString() : null }).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['staff-documents'] }); setEditItem(null) },
  })

  const openEdit = (d: StaffDoc) => {
    setEditItem(d)
    setForm({ bezeichnung: d.bezeichnung, typ: d.typ, ablaufdatum: d.ablaufdatum ? d.ablaufdatum.split('T')[0] : '', dokumentUrl: d.dokumentUrl ?? '', bemerkungen: d.bemerkungen ?? '' })
  }

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
  const F = (k: keyof EditForm) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value })) })

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
              <th className="px-4 py-3 text-left">Ablaufdatum</th>
              <th className="px-4 py-3 text-left">Verifiziert</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(docs ?? []).map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-charcoal">{d.bezeichnung}</td>
                <td className="px-4 py-3"><Badge status={d.typ}/></td>
                <td className="px-4 py-3 text-charcoal-lighter">{d.user?.name ?? '—'}</td>
                <td className={`px-4 py-3 font-medium ${isExpiringSoon(d.ablaufdatum) ? 'text-red-600' : 'text-charcoal-lighter'}`}>
                  {d.ablaufdatum ? new Date(d.ablaufdatum).toLocaleDateString('de-DE') : '—'}
                  {isExpiringSoon(d.ablaufdatum) && <span className="ml-1">⚠️</span>}
                </td>
                <td className="px-4 py-3">{d.verifiziert ? <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full">✓ Ja</span> : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Nein</span>}</td>
                <td className="px-4 py-3"><button onClick={() => openEdit(d)} className="text-charcoal-lighter hover:text-teal-600"><Pencil size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editItem && (
        <Modal title="Dokument bearbeiten" onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div><label className="block text-xs font-medium text-charcoal mb-1">Bezeichnung</label><input {...F('bezeichnung')} className={cls}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Typ</label><select {...F('typ')} className={cls}>{DOC_TYPES.map(v => <option key={v}>{v}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Ablaufdatum</label><input type="date" {...F('ablaufdatum')} className={cls}/></div>
            </div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Dokument-URL</label><input {...F('dokumentUrl')} className={cls}/></div>
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
