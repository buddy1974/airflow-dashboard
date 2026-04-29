import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import api from '../lib/api'

interface MonEntry {
  id: string; recordedAt: string; herzfrequenz: number; atemfrequenz: number
  spo2: number; temperatur: number; alertLevel: string; alertTriggered: boolean
  blutdruckSys: number; blutdruckDia: number; bewusstsein: string; beatmungsmodus: string
  bemerkungen?: string
}
interface MissingData { schicht: string; missingHours: number[] }
interface Patient { vorname: string; nachname: string; diagnoseHaupt: string }
interface EditForm { herzfrequenz: string; atemfrequenz: string; spo2: string; temperatur: string; blutdruckSys: string; blutdruckDia: string; bemerkungen: string }

const HOUR_COLORS: Record<string, string> = { GRUEN: 'bg-teal-400', GELB: 'bg-yellow-400', ROT: 'bg-red-500' }

export default function MonitoringDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [editItem, setEditItem] = useState<MonEntry | null>(null)
  const [form, setForm] = useState<EditForm>({ herzfrequenz: '', atemfrequenz: '', spo2: '', temperatur: '', blutdruckSys: '', blutdruckDia: '', bemerkungen: '' })
  const queryClient = useQueryClient()

  const { data: patient } = useQuery({
    queryKey: ['patient', id],
    queryFn:  () => api.get<{ success: boolean; patient: Patient }>(`/patients/${id}`).then(r => r.data.patient),
    enabled: !!id,
  })
  const { data: entries, isLoading } = useQuery({
    queryKey: ['monitoring-today', id],
    queryFn:  () => api.get<{ success: boolean; entries: MonEntry[] }>(`/monitoring/entries/patient/${id}/today`).then(r => r.data.entries),
    enabled: !!id, refetchInterval: 60000,
  })
  const { data: missingData } = useQuery({
    queryKey: ['monitoring-missing', id],
    queryFn:  () => api.get<{ success: boolean; data: MissingData }>(`/monitoring/patient/${id}/missing`).then(r => r.data.data),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: EditForm) => api.put(`/monitoring/entries/${editItem!.id}`, {
      herzfrequenz: parseInt(payload.herzfrequenz),
      atemfrequenz: parseInt(payload.atemfrequenz),
      spo2:         parseFloat(payload.spo2),
      temperatur:   parseFloat(payload.temperatur),
      blutdruckSys: parseInt(payload.blutdruckSys),
      blutdruckDia: parseInt(payload.blutdruckDia),
      bemerkungen:  payload.bemerkungen || null,
    }).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['monitoring-today', id] }); setEditItem(null) },
  })

  const openEdit = (e: MonEntry) => {
    setEditItem(e)
    setForm({ herzfrequenz: String(e.herzfrequenz), atemfrequenz: String(e.atemfrequenz), spo2: String(e.spo2), temperatur: String(e.temperatur), blutdruckSys: String(e.blutdruckSys), blutdruckDia: String(e.blutdruckDia), bemerkungen: e.bemerkungen ?? '' })
  }

  const entryByHour = (entries ?? []).reduce<Record<number, MonEntry>>((acc, e) => { acc[new Date(e.recordedAt).getUTCHours()] = e; return acc }, {})
  const allHours = Array.from({ length: 24 }, (_, i) => i)

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
  const F = (k: keyof EditForm) => ({ value: form[k], onChange: (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) => setForm(f => ({ ...f, [k]: e.target.value })) })

  return (
    <div>
      <div className="mb-4"><Link to="/monitoring" className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"><ArrowLeft size={16}/> Zurück</Link></div>
      <PageHeader title={patient ? `${patient.vorname} ${patient.nachname}` : 'Patient'} subtitle={patient?.diagnoseHaupt}/>

      {missingData && missingData.missingHours.length > 0 && (
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          ⚠️ Schicht: <strong>{missingData.schicht}</strong> · Fehlende Stunden: {missingData.missingHours.join(', ')} Uhr
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h3 className="text-sm font-semibold text-charcoal-lighter uppercase tracking-wider mb-4">24h Protokoll</h3>
        <div className="grid grid-cols-12 gap-1.5">
          {allHours.map(h => { const e = entryByHour[h]; return (
            <div key={h} title={e ? `${h}:00 — SpO2: ${e.spo2}%` : `${h}:00 — kein Eintrag`}
              className={`h-12 rounded flex items-end justify-center pb-1 ${e ? HOUR_COLORS[e.alertLevel] ?? 'bg-teal-400' : 'bg-gray-100 border border-dashed border-gray-300'}`}>
              <span className={`text-xs font-medium ${e ? 'text-white' : 'text-gray-400'}`}>{h}</span>
            </div>
          )
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-charcoal-lighter">
          {['GRUEN','GELB','ROT'].map(l => <span key={l} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded ${HOUR_COLORS[l]}`}/>{l}</span>)}
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 border border-dashed border-gray-300"/>Fehlend</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Zeit</th>
              <th className="px-4 py-3 text-left">HF</th>
              <th className="px-4 py-3 text-left">AF</th>
              <th className="px-4 py-3 text-left">SpO2</th>
              <th className="px-4 py-3 text-left">RR</th>
              <th className="px-4 py-3 text-left">Temp.</th>
              <th className="px-4 py-3 text-left">Alert</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(entries ?? []).map(e => (
              <tr key={e.id} className={`hover:bg-gray-50 ${e.alertTriggered ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-2.5 font-medium">{new Date(e.recordedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</td>
                <td className="px-4 py-2.5">{e.herzfrequenz}</td>
                <td className="px-4 py-2.5">{e.atemfrequenz}</td>
                <td className="px-4 py-2.5 font-semibold">{e.spo2}%</td>
                <td className="px-4 py-2.5">{e.blutdruckSys}/{e.blutdruckDia}</td>
                <td className="px-4 py-2.5">{e.temperatur}°C</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.alertLevel === 'ROT' ? 'bg-red-100 text-red-700' : e.alertLevel === 'GELB' ? 'bg-yellow-100 text-yellow-700' : 'bg-teal-100 text-teal-700'}`}>{e.alertLevel}</span>
                </td>
                <td className="px-4 py-2.5"><button onClick={() => openEdit(e)} className="text-charcoal-lighter hover:text-teal-600"><Pencil size={14}/></button></td>
              </tr>
            ))}
            {!entries?.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-charcoal-lighter">Noch keine Einträge heute</td></tr>}
          </tbody>
        </table>
      </div>

      {editItem && (
        <Modal title={`Eintrag bearbeiten — ${new Date(editItem.recordedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`} onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Herzfrequenz</label><input type="number" {...F('herzfrequenz')} className={cls}/></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Atemfrequenz</label><input type="number" {...F('atemfrequenz')} className={cls}/></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">SpO2 %</label><input type="number" {...F('spo2')} step="0.1" className={cls}/></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Temperatur</label><input type="number" {...F('temperatur')} step="0.1" className={cls}/></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">RR sys</label><input type="number" {...F('blutdruckSys')} className={cls}/></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">RR dia</label><input type="number" {...F('blutdruckDia')} className={cls}/></div>
            </div>
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
