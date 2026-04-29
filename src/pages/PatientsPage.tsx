import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Activity, Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import api from '../lib/api'

interface Patient {
  id: string; vorname: string; nachname: string; diagnoseHaupt: string
  pflegegrad: string; beatmungspflichtig: boolean; status: string; bemerkungen?: string
  location?: { name: string }
}
interface EditForm { vorname: string; nachname: string; diagnoseHaupt: string; pflegegrad: string; status: string; bemerkungen: string }

export default function PatientsPage() {
  const [editItem, setEditItem] = useState<Patient | null>(null)
  const [form, setForm] = useState<EditForm>({ vorname: '', nachname: '', diagnoseHaupt: '', pflegegrad: 'PG3', status: 'AKTIV', bemerkungen: '' })
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['patients'],
    queryFn:  () => api.get<{ success: boolean; patients: Patient[] }>('/patients').then(r => r.data.patients),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: EditForm) => api.put<{ success: boolean }>(`/patients/${editItem!.id}`, payload).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); setEditItem(null) },
  })

  const openEdit = (p: Patient) => {
    setEditItem(p)
    setForm({ vorname: p.vorname, nachname: p.nachname, diagnoseHaupt: p.diagnoseHaupt, pflegegrad: p.pflegegrad, status: p.status, bemerkungen: p.bemerkungen ?? '' })
  }

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>
  if (error) return <div className="p-6 text-red-600 bg-red-50 rounded-xl">Fehler beim Laden der Patienten</div>

  const F = (k: keyof EditForm) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value })) })
  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"

  return (
    <div>
      <PageHeader title="Patienten" subtitle={`${data?.length ?? 0} Patienten`} />
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Diagnose</th>
              <th className="px-4 py-3 text-left">Pflegegrad</th>
              <th className="px-4 py-3 text-left">Beatmung</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Standort</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data ?? []).map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-charcoal">{p.vorname} {p.nachname}</td>
                <td className="px-4 py-3 text-charcoal-lighter max-w-xs truncate">{p.diagnoseHaupt}</td>
                <td className="px-4 py-3 font-semibold text-teal-600">{p.pflegegrad}</td>
                <td className="px-4 py-3">{p.beatmungspflichtig ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Ja</span> : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Nein</span>}</td>
                <td className="px-4 py-3"><Badge status={p.status}/></td>
                <td className="px-4 py-3 text-charcoal-lighter">{p.location?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Link to={`/monitoring/${p.id}`} className="flex items-center gap-1 text-teal-600 hover:text-teal-700 text-xs font-medium"><Activity size={14}/> Monitoring</Link>
                    <button onClick={() => openEdit(p)} className="text-charcoal-lighter hover:text-teal-600"><Pencil size={14}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editItem && (
        <Modal title={`Patient bearbeiten — ${editItem.vorname} ${editItem.nachname}`} onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Vorname</label><input {...F('vorname')} className={cls}/></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Nachname</label><input {...F('nachname')} className={cls}/></div>
            </div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Diagnose</label><input {...F('diagnoseHaupt')} className={cls}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Pflegegrad</label>
                <select {...F('pflegegrad')} className={cls}>{['PG1','PG2','PG3','PG4','PG5'].map(v => <option key={v}>{v}</option>)}</select>
              </div>
              <div>
                <label className="block text-xs font-medium text-charcoal mb-1">Status</label>
                <select {...F('status')} className={cls}>{['AKTIV','PAUSIERT','ENTLASSEN'].map(v => <option key={v}>{v}</option>)}</select>
              </div>
            </div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Bemerkungen</label><textarea {...F('bemerkungen')} rows={2} className={cls}/></div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditItem(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-charcoal hover:bg-gray-50">Abbrechen</button>
              <button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending} className="px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 disabled:opacity-50">
                {updateMutation.isPending ? 'Speichere…' : 'Speichern'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
