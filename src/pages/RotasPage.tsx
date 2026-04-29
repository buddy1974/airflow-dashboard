import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import api from '../lib/api'

interface Shift {
  id: string; datum: string; schicht: string; status: string; bemerkungen?: string
  user?: { id: string; name: string }
  patient?: { id: string; vorname: string; nachname: string }
  startzeit: string; endzeit: string
}
interface Rota { id: string; wocheVom: string; wocheBis: string; status: string; shifts: Shift[] }
interface EditForm { status: string; bemerkungen: string }

const DAYS_DE = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']
const SHIFT_STATUS = ['GEPLANT','AKTIV','ABGESCHLOSSEN','ABWESEND']

export default function RotasPage() {
  const [editItem, setEditItem] = useState<Shift | null>(null)
  const [form, setForm] = useState<EditForm>({ status: 'GEPLANT', bemerkungen: '' })
  const queryClient = useQueryClient()

  const { data: rota, isLoading } = useQuery({
    queryKey: ['rota-current'],
    queryFn:  () => api.get<{ success: boolean; rota: Rota | null }>('/rotas/current').then(r => r.data.rota),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: EditForm) => api.put(`/rotas/${rota!.id}/shift/${editItem!.id}`, payload).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['rota-current'] }); setEditItem(null) },
  })

  const openEdit = (s: Shift) => { setEditItem(s); setForm({ status: s.status, bemerkungen: s.bemerkungen ?? '' }) }

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  if (!rota) return (
    <div><PageHeader title="Dienstplan" subtitle="Aktuelle Woche"/>
      <div className="bg-white rounded-xl shadow-sm p-8 text-center text-charcoal-lighter">Kein aktiver Dienstplan</div>
    </div>
  )

  const weekDates: Date[] = []
  const start = new Date(rota.wocheVom)
  for (let i = 0; i < 7; i++) { const d = new Date(start); d.setUTCDate(d.getUTCDate() + i); weekDates.push(d) }

  const patients = [...new Map((rota.shifts ?? []).filter(s => s.patient).map(s => [s.patient!.id, s.patient!])).values()]

  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"

  return (
    <div>
      <PageHeader title="Dienstplan" subtitle={`${new Date(rota.wocheVom).toLocaleDateString('de-DE')} – ${new Date(rota.wocheBis).toLocaleDateString('de-DE')} · ${rota.status}`} />
      <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Patient</th>
              {weekDates.map((d, i) => (
                <th key={i} className="px-3 py-3 text-center font-medium">
                  {DAYS_DE[i]}<br/><span className="text-charcoal">{d.getUTCDate()}.{d.getUTCMonth()+1}.</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {patients.map(patient => (
              <tr key={patient.id}>
                <td className="px-4 py-3 font-medium text-charcoal whitespace-nowrap">{patient.vorname} {patient.nachname}</td>
                {weekDates.map((d, i) => {
                  const dayStr = d.toISOString().split('T')[0]
                  const shifts = (rota.shifts ?? []).filter(s => s.patient?.id === patient.id && s.datum.startsWith(dayStr))
                  return (
                    <td key={i} className="px-2 py-2 text-center">
                      {shifts.map(s => (
                        <div key={s.id} className={`text-xs rounded p-1 mb-0.5 relative group ${s.schicht === 'TAG' ? 'bg-teal-100 text-teal-700' : 'bg-charcoal text-white'}`}>
                          <div className="font-semibold">{s.schicht}</div>
                          <div className="truncate">{s.user?.name ?? '—'}</div>
                          <Badge status={s.status}/>
                          <button onClick={() => openEdit(s)} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-current hover:opacity-80">
                            <Pencil size={10}/>
                          </button>
                        </div>
                      ))}
                    </td>
                  )
                })}
              </tr>
            ))}
            {!patients.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-charcoal-lighter">Keine Schichten geplant</td></tr>}
          </tbody>
        </table>
      </div>

      {editItem && (
        <Modal title={`Schicht bearbeiten — ${editItem.schicht} ${editItem.user?.name ?? ''}`} onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={cls}>
                {SHIFT_STATUS.map(v => <option key={v}>{v}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Bemerkungen</label><textarea value={form.bemerkungen} onChange={e => setForm(f => ({ ...f, bemerkungen: e.target.value }))} rows={2} className={cls}/></div>
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
