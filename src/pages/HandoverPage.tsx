import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import api from '../lib/api'

interface Handover {
  id: string; schicht: string; schichtDatum: string; status: string; dringend: boolean
  zusammenfassung: string; offenePunkte?: string; massnahmen?: string
  patient?: { vorname: string; nachname: string }
}
interface EditForm { zusammenfassung: string; offenePunkte: string; massnahmen: string; dringend: boolean }

export default function HandoverPage() {
  const [editItem, setEditItem] = useState<Handover | null>(null)
  const [form, setForm] = useState<EditForm>({ zusammenfassung: '', offenePunkte: '', massnahmen: '', dringend: false })
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['handovers-open'],
    queryFn:  () => api.get<{ success: boolean; handovers: Handover[] }>('/handover/open').then(r => r.data.handovers),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: EditForm) => api.put(`/handover/${editItem!.id}`, payload).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['handovers-open'] }); setEditItem(null) },
  })

  const openEdit = (h: Handover) => {
    setEditItem(h)
    setForm({ zusammenfassung: h.zusammenfassung, offenePunkte: h.offenePunkte ?? '', massnahmen: h.massnahmen ?? '', dringend: h.dringend })
  }

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"

  return (
    <div>
      <PageHeader title="Schichtübergabe" subtitle={`${data?.length ?? 0} offene Übergaben`} />
      <div className="space-y-4">
        {(data ?? []).map(h => (
          <div key={h.id} className={`bg-white rounded-xl shadow-sm p-5 border-l-4 ${h.dringend ? 'border-red-500' : 'border-teal-400'}`}>
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-charcoal">{h.patient ? `${h.patient.vorname} ${h.patient.nachname}` : '—'}</span>
                {h.dringend && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">DRINGEND</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-charcoal-lighter">{new Date(h.schichtDatum).toLocaleDateString('de-DE')} · {h.schicht}</span>
                <Badge status={h.status}/>
                {h.status === 'ENTWURF' && <button onClick={() => openEdit(h)} className="text-charcoal-lighter hover:text-teal-600"><Pencil size={14}/></button>}
              </div>
            </div>
            <p className="text-sm text-charcoal">{h.zusammenfassung}</p>
            {h.offenePunkte && <p className="text-xs text-orange-700 mt-2 bg-orange-50 px-3 py-2 rounded">⚠️ {h.offenePunkte}</p>}
          </div>
        ))}
        {!data?.length && <div className="bg-white rounded-xl shadow-sm p-8 text-center text-charcoal-lighter">Keine offenen Übergaben</div>}
      </div>

      {editItem && (
        <Modal title={`Übergabe bearbeiten — ${editItem.patient?.vorname ?? ''} ${editItem.patient?.nachname ?? ''}`} onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div><label className="block text-xs font-medium text-charcoal mb-1">Zusammenfassung</label><textarea value={form.zusammenfassung} onChange={e => setForm(f => ({ ...f, zusammenfassung: e.target.value }))} rows={4} className={cls}/></div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Offene Punkte</label><textarea value={form.offenePunkte} onChange={e => setForm(f => ({ ...f, offenePunkte: e.target.value }))} rows={2} className={cls}/></div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Maßnahmen</label><textarea value={form.massnahmen} onChange={e => setForm(f => ({ ...f, massnahmen: e.target.value }))} rows={2} className={cls}/></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.dringend} onChange={e => setForm(f => ({ ...f, dringend: e.target.checked }))} className="accent-teal-500"/> Dringend</label>
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
