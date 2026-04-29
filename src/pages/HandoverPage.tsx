import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import AiWriteButton from '../components/AiWriteButton'
import StatusBanner from '../components/StatusBanner'
import api from '../lib/api'

interface Patient  { id: string; vorname: string; nachname: string }
interface Handover { id: string; schicht: string; schichtDatum: string; status: string; dringend: boolean; zusammenfassung: string; offenePunkte?: string; massnahmen?: string; patient?: { vorname: string; nachname: string } }
interface EditForm  { zusammenfassung: string; offenePunkte: string; massnahmen: string; dringend: boolean }

export default function HandoverPage() {
  const [editItem,    setEditItem]    = useState<Handover | null>(null)
  const [form,        setForm]        = useState<EditForm>({ zusammenfassung: '', offenePunkte: '', massnahmen: '', dringend: false })
  const [patientId,   setPatientId]   = useState('')
  const [schicht,     setSchicht]     = useState('TAG')
  const [extraInfo,   setExtraInfo]   = useState('')
  const [aiResult,    setAiResult]    = useState('')
  const [aiLoading,   setAiLoading]   = useState(false)
  const [savedBanner, setSavedBanner] = useState(false)
  const [showManual,  setShowManual]  = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({ queryKey: ['handovers-open'], queryFn: () => api.get<{ success: boolean; handovers: Handover[] }>('/handover/open').then(r => r.data.handovers) })
  const { data: patients }  = useQuery({ queryKey: ['patients'], queryFn: () => api.get<{ success: boolean; patients: Patient[] }>('/patients').then(r => r.data.patients) })

  const updateMutation = useMutation({
    mutationFn: (p: EditForm) => api.put(`/handover/${editItem!.id}`, p).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['handovers-open'] }); setEditItem(null); setSavedBanner(true) },
  })
  const ackMutation = useMutation({
    mutationFn: (id: string) => api.put(`/handover/${id}/quittieren`).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['handovers-open'] }); setSavedBanner(true) },
  })

  const generateAi = async () => {
    setAiLoading(true)
    try {
      const res = await api.post<{ success: boolean; data: { result?: string; response?: string } }>('/ai/handover-writer', { patientId, schicht, kontext: extraInfo })
      setAiResult(res.data.data.result ?? res.data.data.response ?? 'Kein Ergebnis.')
    } catch {
      setAiResult('KI-Übergabebericht noch nicht verfügbar.')
    } finally {
      setAiLoading(false)
    }
  }

  const saveAiResult = async () => {
    if (!aiResult || !patientId) return
    await api.post('/handover', {
      patientId, schicht,
      schichtDatum: new Date().toISOString(),
      zusammenfassung: aiResult,
    })
    queryClient.invalidateQueries({ queryKey: ['handovers-open'] })
    setAiResult(''); setSavedBanner(true)
  }

  const openEdit = (h: Handover) => { setEditItem(h); setForm({ zusammenfassung: h.zusammenfassung, offenePunkte: h.offenePunkte ?? '', massnahmen: h.massnahmen ?? '', dringend: h.dringend }) }
  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"

  return (
    <div className="space-y-6">
      <PageHeader title="Schichtübergabe" subtitle="Dokumentieren Sie die Übergabe zwischen den Schichten. Die KI kann den Bericht automatisch für Sie schreiben." />

      {savedBanner && <StatusBanner type="success" message="✅ Gespeichert! Die Übergabe wurde erfolgreich übernommen." autoDismiss onDismiss={() => setSavedBanner(false)}/>}

      {/* AI Hero */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-6 text-white">
        <h2 className="text-xl font-bold mb-1">✨ KI schreibt Ihren Übergabebericht automatisch</h2>
        <p className="text-teal-100 text-sm mb-5">Wählen Sie einfach den Patienten und die Schicht aus — die KI liest alle Messwerte und schreibt in Sekunden einen professionellen Übergabebericht.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <select value={patientId} onChange={e => setPatientId(e.target.value)}
            className="border-0 bg-white/15 text-white placeholder-white/70 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/50">
            <option value="" className="text-charcoal">— Patient auswählen —</option>
            {(patients ?? []).map(p => <option key={p.id} value={p.id} className="text-charcoal">{p.vorname} {p.nachname}</option>)}
          </select>
          <select value={schicht} onChange={e => setSchicht(e.target.value)}
            className="border-0 bg-white/15 text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/50">
            <option value="TAG" className="text-charcoal">Tagschicht (06:00–18:00)</option>
            <option value="NACHT" className="text-charcoal">Nachtschicht (18:00–06:00)</option>
          </select>
          <input value={extraInfo} onChange={e => setExtraInfo(e.target.value)} placeholder="Zusätzliche Hinweise (optional)"
            className="border-0 bg-white/15 text-white placeholder-white/70 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"/>
        </div>
        <AiWriteButton label="Übergabebericht jetzt erstellen lassen" onClick={generateAi} loading={aiLoading} disabled={!patientId}/>
        {aiResult && (
          <div className="mt-4 bg-white rounded-xl p-4">
            <textarea value={aiResult} onChange={e => setAiResult(e.target.value)} rows={6}
              className="w-full text-charcoal text-sm leading-relaxed resize-none focus:outline-none"/>
            <div className="flex gap-2 mt-3">
              <button onClick={() => navigator.clipboard.writeText(aiResult)} className="text-xs bg-gray-100 text-charcoal hover:bg-gray-200 px-3 py-1.5 rounded-lg">📋 Kopieren</button>
              <button onClick={saveAiResult} className="text-xs bg-teal-500 text-white hover:bg-teal-600 px-3 py-1.5 rounded-lg font-medium">💾 Als Übergabe speichern</button>
            </div>
          </div>
        )}
      </div>

      {/* Open handovers */}
      {isLoading ? (
        <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"/></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h3 className="font-semibold text-charcoal">📋 Offene Übergaben — Warten auf Quittierung</h3>
            <p className="text-xs text-charcoal-lighter mt-0.5">Diese Berichte wurden erstellt, aber noch nicht von der nächsten Schicht bestätigt.</p>
          </div>
          <div className="divide-y">
            {(data ?? []).map(h => (
              <div key={h.id} className={`p-5 ${h.dringend ? 'bg-red-50' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-semibold text-charcoal">{h.patient ? `${h.patient.vorname} ${h.patient.nachname}` : '—'}</span>
                    {h.dringend && <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">🔴 DRINGEND</span>}
                    <p className="text-xs text-charcoal-lighter mt-0.5">{new Date(h.schichtDatum).toLocaleDateString('de-DE')} · {h.schicht === 'TAG' ? 'Tagschicht' : 'Nachtschicht'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge status={h.status}/>
                    {h.status === 'ENTWURF' && <button onClick={() => openEdit(h)} className="text-charcoal-lighter hover:text-teal-600"><Pencil size={14}/></button>}
                  </div>
                </div>
                <p className="text-sm text-charcoal leading-relaxed">{h.zusammenfassung}</p>
                {h.offenePunkte && <p className="text-xs text-orange-700 mt-2 bg-orange-50 px-3 py-2 rounded-xl">⚠️ Offene Punkte: {h.offenePunkte}</p>}
                {h.status === 'ABGESCHLOSSEN' && (
                  <button onClick={() => ackMutation.mutate(h.id)} disabled={ackMutation.isPending}
                    className="mt-3 w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                    ✅ Quittieren — Ich habe die Übergabe gelesen und bestätigt
                  </button>
                )}
              </div>
            ))}
            {!data?.length && (
              <div className="p-8 text-center">
                <p className="text-teal-600 font-medium">✅ Alle Übergaben quittiert</p>
                <p className="text-xs text-charcoal-lighter mt-1">Keine offenen Übergaben vorhanden</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual form */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <button onClick={() => setShowManual(s => !s)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50">
          <span className="font-medium text-charcoal">Oder: Übergabe manuell erfassen</span>
          <span className="text-charcoal-lighter text-sm">{showManual ? '▲ Ausblenden' : '▼ Anzeigen'}</span>
        </button>
        {showManual && (
          <div className="px-5 pb-5 space-y-3 border-t pt-4">
            <select value={patientId} onChange={e => setPatientId(e.target.value)} className={cls}>
              <option value="">— Patient auswählen —</option>
              {(patients ?? []).map(p => <option key={p.id} value={p.id}>{p.vorname} {p.nachname}</option>)}
            </select>
            <select value={schicht} onChange={e => setSchicht(e.target.value)} className={cls}>
              <option value="TAG">Tagschicht</option><option value="NACHT">Nachtschicht</option>
            </select>
            <textarea value={form.zusammenfassung} onChange={e => setForm(f => ({ ...f, zusammenfassung: e.target.value }))} rows={4} placeholder="Schreiben Sie hier die Übergabe…" className={`${cls} resize-none`}/>
            <button
              onClick={async () => {
                if (!form.zusammenfassung || !patientId) return
                await api.post('/handover', { patientId, schicht, schichtDatum: new Date().toISOString(), zusammenfassung: form.zusammenfassung, offenePunkte: form.offenePunkte, massnahmen: form.massnahmen, dringend: form.dringend })
                queryClient.invalidateQueries({ queryKey: ['handovers-open'] })
                setForm({ zusammenfassung: '', offenePunkte: '', massnahmen: '', dringend: false })
                setSavedBanner(true); setShowManual(false)
              }}
              className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-5 py-2.5 rounded-xl text-sm">
              💾 Übergabe speichern
            </button>
          </div>
        )}
      </div>

      {editItem && (
        <Modal title="Übergabe bearbeiten" onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div><label className="block text-xs font-medium text-charcoal mb-1">Zusammenfassung</label><textarea value={form.zusammenfassung} onChange={e => setForm(f => ({ ...f, zusammenfassung: e.target.value }))} rows={5} className={cls}/></div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Offene Punkte</label><textarea value={form.offenePunkte} onChange={e => setForm(f => ({ ...f, offenePunkte: e.target.value }))} rows={2} className={cls}/></div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Maßnahmen</label><textarea value={form.massnahmen} onChange={e => setForm(f => ({ ...f, massnahmen: e.target.value }))} rows={2} className={cls}/></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.dringend} onChange={e => setForm(f => ({ ...f, dringend: e.target.checked }))} className="accent-teal-500"/> 🔴 Als dringend markieren</label>
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
