import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import api from '../lib/api'

interface Patient { id: string; vorname: string; nachname: string }
interface Medication {
  id: string; wirkstoff: string; handelsname?: string; staerke: string; route: string
  dosierung: string; haeufigkeit: string; isBtm: boolean; anweisung?: string
}
interface EditForm { dosierung: string; haeufigkeit: string; anweisung: string }

export default function MedicationsPage() {
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [editItem, setEditItem] = useState<Medication | null>(null)
  const [form, setForm] = useState<EditForm>({ dosierung: '', haeufigkeit: '', anweisung: '' })
  const queryClient = useQueryClient()

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn:  () => api.get<{ success: boolean; patients: Patient[] }>('/patients').then(r => r.data.patients),
  })
  const { data: meds, isLoading } = useQuery({
    queryKey: ['medications-active', selectedPatientId],
    queryFn:  () => api.get<{ success: boolean; medications: Medication[] }>(`/medications/patient/${selectedPatientId}/active`).then(r => r.data.medications),
    enabled: !!selectedPatientId,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: EditForm) => api.put(`/medications/${editItem!.id}`, payload).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['medications-active', selectedPatientId] }); setEditItem(null) },
  })

  const openEdit = (m: Medication) => {
    setEditItem(m)
    setForm({ dosierung: m.dosierung, haeufigkeit: m.haeufigkeit, anweisung: m.anweisung ?? '' })
  }

  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
  const F = (k: keyof EditForm) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value })) })

  return (
    <div>
      <PageHeader title="Medikamente" subtitle="Aktive Medikation je Patient" />
      <div className="mb-4">
        <select value={selectedPatientId} onChange={e => setSelectedPatientId(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 w-full max-w-sm">
          <option value="">— Patient auswählen —</option>
          {(patients ?? []).map(p => <option key={p.id} value={p.id}>{p.vorname} {p.nachname}</option>)}
        </select>
      </div>

      {selectedPatientId && isLoading && <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"/></div>}

      {selectedPatientId && !isLoading && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Wirkstoff</th>
                <th className="px-4 py-3 text-left">Handelsname</th>
                <th className="px-4 py-3 text-left">Stärke</th>
                <th className="px-4 py-3 text-left">Route</th>
                <th className="px-4 py-3 text-left">Dosierung</th>
                <th className="px-4 py-3 text-left">Häufigkeit</th>
                <th className="px-4 py-3 text-left">BtM</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(meds ?? []).map(m => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-charcoal">{m.wirkstoff}</td>
                  <td className="px-4 py-3 text-charcoal-lighter">{m.handelsname ?? '—'}</td>
                  <td className="px-4 py-3">{m.staerke}</td>
                  <td className="px-4 py-3"><Badge status={m.route}/></td>
                  <td className="px-4 py-3">{m.dosierung}</td>
                  <td className="px-4 py-3">{m.haeufigkeit}</td>
                  <td className="px-4 py-3">{m.isBtm ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">BtM</span> : '—'}</td>
                  <td className="px-4 py-3"><button onClick={() => openEdit(m)} className="text-charcoal-lighter hover:text-teal-600"><Pencil size={14}/></button></td>
                </tr>
              ))}
              {!meds?.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-charcoal-lighter">Keine aktiven Medikamente</td></tr>}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {editItem && (
        <Modal title={`Medikament bearbeiten — ${editItem.wirkstoff}`} onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div><label className="block text-xs font-medium text-charcoal mb-1">Dosierung</label><input {...F('dosierung')} className={cls}/></div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Häufigkeit</label><input {...F('haeufigkeit')} className={cls}/></div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Anweisung</label><textarea {...F('anweisung')} rows={2} className={cls}/></div>
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
