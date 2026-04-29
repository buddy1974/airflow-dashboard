import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { GraduationCap, Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import StatCard from '../components/StatCard'
import EmptyState from '../components/EmptyState'
import StatusBanner from '../components/StatusBanner'
import api from '../lib/api'

interface TrainingRecord { id: string; bezeichnung: string; anbieter?: string; status: string; gueltigBis?: string; pflichtschulung: boolean; abgeschlossenAm?: string; user?: { name: string } }
interface EditForm { bezeichnung: string; anbieter: string; status: string; gueltigBis: string; pflichtschulung: boolean }

const STATUS_PLAIN: Record<string, string> = {
  ABGESCHLOSSEN: '✅ Abgeschlossen',
  AUSSTEHEND:    '⏳ Noch ausstehend',
  ABGELAUFEN:    '🚨 Abgelaufen — sofort erneuern!',
}
const TRAINING_STATUS = ['AUSSTEHEND','ABGESCHLOSSEN','ABGELAUFEN']

export default function TrainingPage() {
  const [editItem,    setEditItem]    = useState<TrainingRecord | null>(null)
  const [form,        setForm]        = useState<EditForm>({ bezeichnung: '', anbieter: '', status: 'AUSSTEHEND', gueltigBis: '', pflichtschulung: false })
  const [savedBanner, setSavedBanner] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['training'], queryFn: () => api.get<{ success: boolean; records: TrainingRecord[] }>('/training').then(r => r.data.records) })
  const { data: overdue }   = useQuery({ queryKey: ['training-overdue'], queryFn: () => api.get<{ success: boolean; records: TrainingRecord[] }>('/training/overdue').then(r => r.data.records) })

  const updateMutation = useMutation({
    mutationFn: (p: EditForm) => api.put(`/training/${editItem!.id}`, { ...p, gueltigBis: p.gueltigBis ? new Date(p.gueltigBis).toISOString() : null }).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['training'] }); setEditItem(null); setSavedBanner(true) },
  })

  const openEdit = (r: TrainingRecord) => { setEditItem(r); setForm({ bezeichnung: r.bezeichnung, anbieter: r.anbieter ?? '', status: r.status, gueltigBis: r.gueltigBis ? r.gueltigBis.split('T')[0] : '', pflichtschulung: r.pflichtschulung }) }
  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"

  const counts = { done: data?.filter(r => r.status === 'ABGESCHLOSSEN').length ?? 0, pending: data?.filter(r => r.status === 'AUSSTEHEND').length ?? 0, expired: data?.filter(r => r.status === 'ABGELAUFEN').length ?? 0 }

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  return (
    <div className="space-y-6">
      <PageHeader title="Schulungen & Fortbildungen" subtitle="Behalten Sie den Überblick über alle Pflichtschulungen und Zertifizierungen Ihres Teams."
        action={<button className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-600">➕ Schulung hinzufügen</button>}
      />

      {savedBanner && <StatusBanner type="success" message="✅ Gespeichert!" autoDismiss onDismiss={() => setSavedBanner(false)}/>}

      {overdue && overdue.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3 text-sm text-red-800 font-medium">
          🚨 Achtung: {overdue.length} Schulungsnachweis{overdue.length !== 1 ? 'e' : ''} abgelaufen — bitte sofort erneuern!
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Abgeschlossen" value={counts.done}    icon={<GraduationCap size={20}/>} color="teal"/>
        <StatCard label="Ausstehend"    value={counts.pending}  icon={<GraduationCap size={20}/>} color="yellow"/>
        <StatCard label="Abgelaufen"    value={counts.expired}  icon={<GraduationCap size={20}/>} color={counts.expired > 0 ? 'red' : 'grey'}/>
      </div>

      {!data?.length ? (
        <EmptyState title="Noch keine Schulungen" message="Fügen Sie Schulungsnachweise Ihrer Mitarbeiter hinzu." actionLabel="➕ Schulung hinzufügen" icon={<GraduationCap size={40}/>}/>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Mitarbeiter</th>
                <th className="px-4 py-3 text-left">Schulung</th>
                <th className="px-4 py-3 text-left">Anbieter</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Pflicht</th>
                <th className="px-4 py-3 text-left">Gültig bis</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{r.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 font-medium text-charcoal">{r.bezeichnung}</td>
                  <td className="px-4 py-3 text-charcoal-lighter">{r.anbieter ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${r.status === 'ABGESCHLOSSEN' ? 'text-teal-600' : r.status === 'ABGELAUFEN' ? 'text-red-600' : 'text-yellow-600'}`}>
                      {STATUS_PLAIN[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{r.pflichtschulung ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">🔴 Pflicht</span> : '—'}</td>
                  <td className={`px-4 py-3 text-sm ${r.gueltigBis && new Date(r.gueltigBis) < new Date() ? 'text-red-600 font-bold' : 'text-charcoal-lighter'}`}>
                    {r.gueltigBis ? new Date(r.gueltigBis).toLocaleDateString('de-DE') : '—'}
                  </td>
                  <td className="px-4 py-3"><button onClick={() => openEdit(r)} className="text-charcoal-lighter hover:text-teal-600"><Pencil size={14}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editItem && (
        <Modal title="Schulung bearbeiten" onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div><label className="block text-xs font-medium text-charcoal mb-1">Schulungsbezeichnung</label><input value={form.bezeichnung} onChange={e => setForm(f => ({ ...f, bezeichnung: e.target.value }))} className={cls}/></div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Anbieter / Institut</label><input value={form.anbieter} onChange={e => setForm(f => ({ ...f, anbieter: e.target.value }))} className={cls}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={cls}>{TRAINING_STATUS.map(v => <option key={v} value={v}>{STATUS_PLAIN[v]?.replace(/[✅⏳🚨]\s*/,'') ?? v}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Gültig bis</label><input type="date" value={form.gueltigBis} onChange={e => setForm(f => ({ ...f, gueltigBis: e.target.value }))} className={cls}/></div>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.pflichtschulung} onChange={e => setForm(f => ({ ...f, pflichtschulung: e.target.checked }))} className="accent-teal-500"/> 🔴 Pflichtschulung</label>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditItem(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Abbrechen</button>
              <button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending} className="px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 disabled:opacity-50">💾 {updateMutation.isPending ? 'Speichere…' : 'Änderungen speichern'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
