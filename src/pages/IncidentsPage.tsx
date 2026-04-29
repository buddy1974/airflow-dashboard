import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import api from '../lib/api'

interface Incident {
  id: string; titel: string; beschreibung: string; severity: string; status: string
  occurredAt: string; mdkMeldepflichtig: boolean; massnahmenErgriffen?: string
  patient?: { vorname: string; nachname: string }
}
interface EditForm { titel: string; beschreibung: string; severity: string; status: string; massnahmenErgriffen: string }

const SEVERITIES = ['NIEDRIG','MITTEL','HOCH','KRITISCH']
const STATUSES   = ['OFFEN','IN_BEARBEITUNG','GESCHLOSSEN']

export default function IncidentsPage() {
  const [severityFilter, setSeverityFilter] = useState('')
  const [editItem, setEditItem] = useState<Incident | null>(null)
  const [form, setForm] = useState<EditForm>({ titel: '', beschreibung: '', severity: 'MITTEL', status: 'OFFEN', massnahmenErgriffen: '' })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', severityFilter],
    queryFn:  () => api.get<{ success: boolean; incidents: Incident[] }>(`/incidents${severityFilter ? `?severity=${severityFilter}` : ''}`).then(r => r.data.incidents),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: EditForm) => api.put(`/incidents/${editItem!.id}`, payload).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['incidents', severityFilter] }); setEditItem(null) },
  })

  const openEdit = (i: Incident) => {
    setEditItem(i)
    setForm({ titel: i.titel, beschreibung: i.beschreibung, severity: i.severity, status: i.status, massnahmenErgriffen: i.massnahmenErgriffen ?? '' })
  }

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
  const F = (k: keyof EditForm) => ({ value: form[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value })) })

  return (
    <div>
      <PageHeader title="Vorfälle" action={
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
          <option value="">Alle Schweregrade</option>
          {SEVERITIES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      }/>
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Titel</th>
              <th className="px-4 py-3 text-left">Patient</th>
              <th className="px-4 py-3 text-left">Schweregrad</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">MDK</th>
              <th className="px-4 py-3 text-left">Datum</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data ?? []).map(i => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-charcoal max-w-xs truncate">{i.titel}</td>
                <td className="px-4 py-3">{i.patient ? `${i.patient.vorname} ${i.patient.nachname}` : '—'}</td>
                <td className="px-4 py-3"><Badge status={i.severity}/></td>
                <td className="px-4 py-3"><Badge status={i.status}/></td>
                <td className="px-4 py-3">{i.mdkMeldepflichtig ? <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Ja</span> : '—'}</td>
                <td className="px-4 py-3 text-charcoal-lighter">{new Date(i.occurredAt).toLocaleDateString('de-DE')}</td>
                <td className="px-4 py-3"><button onClick={() => openEdit(i)} className="text-charcoal-lighter hover:text-teal-600"><Pencil size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editItem && (
        <Modal title="Vorfall bearbeiten" onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div><label className="block text-xs font-medium text-charcoal mb-1">Titel</label><input {...F('titel')} className={cls}/></div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Beschreibung</label><textarea {...F('beschreibung')} rows={3} className={cls}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Schweregrad</label><select {...F('severity')} className={cls}>{SEVERITIES.map(v => <option key={v}>{v}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Status</label><select {...F('status')} className={cls}>{STATUSES.map(v => <option key={v}>{v}</option>)}</select></div>
            </div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Maßnahmen ergriffen</label><textarea {...F('massnahmenErgriffen')} rows={2} className={cls}/></div>
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
