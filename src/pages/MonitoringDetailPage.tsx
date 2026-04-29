import { useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Copy, Check } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import HelpTooltip from '../components/HelpTooltip'
import AiWriteButton from '../components/AiWriteButton'
import StatusBanner from '../components/StatusBanner'
import OcrUpload from '../components/OcrUpload'
import api from '../lib/api'

interface MonEntry {
  id: string; recordedAt: string; herzfrequenz: number; atemfrequenz: number
  spo2: number; temperatur: number; alertLevel: string; alertTriggered: boolean
  blutdruckSys: number; blutdruckDia: number; bewusstsein: string; beatmungsmodus: string; bemerkungen?: string
}
interface MissingData  { schicht: string; missingHours: number[] }
interface Patient      { vorname: string; nachname: string; diagnoseHaupt: string }
interface EditForm     { herzfrequenz: string; atemfrequenz: string; spo2: string; temperatur: string; blutdruckSys: string; blutdruckDia: string; bemerkungen: string }
interface NewEntryForm { herzfrequenz: string; atemfrequenz: string; spo2: string; temperatur: string; blutdruckSys: string; blutdruckDia: string; bewusstsein: string; beatmungsmodus: string; atemzugvolumen: string; peep: string; cuffDruck: string; lagerung: string; bemerkungen: string }

const HOUR_COLORS: Record<string, string> = { GRUEN: 'bg-teal-400', GELB: 'bg-yellow-400', ROT: 'bg-red-500' }
const BEWUSSTSEIN_OPTIONS = [{ v: 'WACH', l: 'Wach' }, { v: 'SCHLAEFRIG', l: 'Schläfrig' }, { v: 'SOMNOLENT', l: 'Somnolent (schwer erweckbar)' }, { v: 'KOMATOEES', l: 'Komatös (nicht erweckbar)' }]
const BEATMUNG_OPTIONS    = [{ v: 'CPAP', l: 'CPAP' }, { v: 'BIPAP', l: 'BiPAP' }, { v: 'IPPV', l: 'IPPV (kontrolliert)' }, { v: 'ASB', l: 'ASB (assistiert)' }, { v: 'SPONTAN', l: 'Spontanatmung' }]
const LAGERUNG_OPTIONS    = [{ v: 'RUECKENLAGE', l: 'Rückenlage' }, { v: 'GRAD_30', l: '30° Oberkörper hoch' }, { v: 'GRAD_45', l: '45° Oberkörper hoch' }, { v: 'SEITENLAGE_L', l: 'Seitenlage links' }, { v: 'SEITENLAGE_R', l: 'Seitenlage rechts' }]

const EMPTY_ENTRY: NewEntryForm = { herzfrequenz: '', atemfrequenz: '', spo2: '', temperatur: '', blutdruckSys: '', blutdruckDia: '', bewusstsein: 'WACH', beatmungsmodus: 'CPAP', atemzugvolumen: '', peep: '', cuffDruck: '', lagerung: 'RUECKENLAGE', bemerkungen: '' }

export default function MonitoringDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()

  const [editItem,   setEditItem]   = useState<MonEntry | null>(null)
  const [editForm,   setEditForm]   = useState<EditForm>({ herzfrequenz: '', atemfrequenz: '', spo2: '', temperatur: '', blutdruckSys: '', blutdruckDia: '', bemerkungen: '' })
  const [entryForm,  setEntryForm]  = useState<NewEntryForm>(EMPTY_ENTRY)
  const [showOcr,    setShowOcr]    = useState(false)
  const [aiResult,   setAiResult]   = useState('')
  const [aiLoading,  setAiLoading]  = useState(false)
  const [aiCopied,   setAiCopied]   = useState(false)
  const [savedBanner, setSavedBanner] = useState(false)

  const { data: patient } = useQuery({ queryKey: ['patient', id], queryFn: () => api.get<{ success: boolean; patient: Patient }>(`/patients/${id}`).then(r => r.data.patient), enabled: !!id })
  const { data: entries, isLoading } = useQuery({ queryKey: ['monitoring-today', id], queryFn: () => api.get<{ success: boolean; entries: MonEntry[] }>(`/monitoring/entries/patient/${id}/today`).then(r => r.data.entries), enabled: !!id, refetchInterval: 60000 })
  const { data: missingData } = useQuery({ queryKey: ['monitoring-missing', id], queryFn: () => api.get<{ success: boolean; data: MissingData }>(`/monitoring/patient/${id}/missing`).then(r => r.data.data), enabled: !!id })

  const updateMutation = useMutation({
    mutationFn: (p: EditForm) => api.put(`/monitoring/entries/${editItem!.id}`, { herzfrequenz: parseInt(p.herzfrequenz), atemfrequenz: parseInt(p.atemfrequenz), spo2: parseFloat(p.spo2), temperatur: parseFloat(p.temperatur), blutdruckSys: parseInt(p.blutdruckSys), blutdruckDia: parseInt(p.blutdruckDia), bemerkungen: p.bemerkungen || null }).then(r => r.data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['monitoring-today', id] }); setEditItem(null) },
  })

  const createMutation = useMutation({
    mutationFn: (f: NewEntryForm) => api.post('/monitoring/entry', {
      patientId: id, recordedAt: new Date().toISOString(),
      herzfrequenz: parseInt(f.herzfrequenz), atemfrequenz: parseInt(f.atemfrequenz),
      spo2: parseFloat(f.spo2), temperatur: parseFloat(f.temperatur),
      blutdruckSys: parseInt(f.blutdruckSys), blutdruckDia: parseInt(f.blutdruckDia),
      bewusstsein: f.bewusstsein, beatmungsmodus: f.beatmungsmodus, lagerung: f.lagerung,
      atemzugvolumen: f.atemzugvolumen ? parseInt(f.atemzugvolumen) : undefined,
      peep: f.peep ? parseFloat(f.peep) : undefined,
      cuffDruck: f.cuffDruck ? parseFloat(f.cuffDruck) : undefined,
      bemerkungen: f.bemerkungen || undefined,
    }).then(r => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitoring-today', id] })
      queryClient.invalidateQueries({ queryKey: ['monitoring-missing', id] })
      setEntryForm(EMPTY_ENTRY)
      setSavedBanner(true)
    },
  })

  const generateSummary = async () => {
    if (!id) return
    setAiLoading(true)
    try {
      const res = await api.post<{ success: boolean; data: { result?: string } }>('/ai/monitoring-summary', { patientId: id, schicht: missingData?.schicht ?? 'TAG', datum: new Date().toISOString().split('T')[0] })
      setAiResult(res.data.data.result ?? 'Keine Zusammenfassung erstellt.')
    } catch {
      setAiResult('KI-Zusammenfassung noch nicht verfügbar.')
    } finally {
      setAiLoading(false)
    }
  }

  const alertPreview = useMemo(() => {
    const msgs: string[] = []
    const s = parseFloat(entryForm.spo2)
    const h = parseInt(entryForm.herzfrequenz)
    if (s > 0 && s < 90) msgs.push('🚨 SpO2 unter 90% — ROTER Alert wird ausgelöst')
    else if (s > 0 && s < 94) msgs.push('⚠️ SpO2 unter 94% — Gelber Alert wird ausgelöst')
    if (h > 0 && (h < 40 || h > 140)) msgs.push('🚨 Herzfrequenz außerhalb des kritischen Bereichs')
    else if (h > 0 && (h < 50 || h > 120)) msgs.push('⚠️ Herzfrequenz außerhalb des Normalbereichs')
    return msgs
  }, [entryForm.spo2, entryForm.herzfrequenz])

  const openEdit = (e: MonEntry) => { setEditItem(e); setEditForm({ herzfrequenz: String(e.herzfrequenz), atemfrequenz: String(e.atemfrequenz), spo2: String(e.spo2), temperatur: String(e.temperatur), blutdruckSys: String(e.blutdruckSys), blutdruckDia: String(e.blutdruckDia), bemerkungen: e.bemerkungen ?? '' }) }
  const entryByHour = (entries ?? []).reduce<Record<number, MonEntry>>((acc, e) => { acc[new Date(e.recordedAt).getUTCHours()] = e; return acc }, {})
  const allHours = Array.from({ length: 24 }, (_, i) => i)
  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  return (
    <div className="space-y-6">
      <div className="mb-2"><Link to="/monitoring" className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700"><ArrowLeft size={16}/> Zurück zur Übersicht</Link></div>
      <PageHeader
        title={`Überwachungsprotokoll — ${patient ? `${patient.vorname} ${patient.nachname}` : '…'}`}
        subtitle="Alle Messwerte des heutigen Tages auf einen Blick."
      />

      {savedBanner && <StatusBanner type="success" message="✅ Messwerte gespeichert! Die Werte wurden erfolgreich eingetragen." autoDismiss onDismiss={() => setSavedBanner(false)}/>}

      {missingData && missingData.missingHours.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-sm text-yellow-800">
          ⚠️ Schicht <strong>{missingData.schicht}</strong> · Fehlende Stunden: {missingData.missingHours.join(', ')} Uhr
        </div>
      )}

      {/* AI panel */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-2xl p-5 text-white">
        <h3 className="font-bold text-lg mb-1">✨ KI-Schichtzusammenfassung erstellen lassen</h3>
        <p className="text-teal-100 text-sm mb-4">Die KI liest alle heutigen Messwerte und schreibt automatisch einen professionellen Schichtbericht für die Übergabe.</p>
        <AiWriteButton label="Zusammenfassung erstellen" onClick={generateSummary} loading={aiLoading}/>
        {aiResult && (
          <div className="mt-4 bg-white/10 rounded-xl p-4 relative">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{aiResult}</p>
            <button onClick={() => { navigator.clipboard.writeText(aiResult); setAiCopied(true); setTimeout(() => setAiCopied(false), 2000) }}
              className="absolute top-3 right-3 text-xs bg-white/20 hover:bg-white/30 text-white px-2.5 py-1.5 rounded-lg flex items-center gap-1">
              {aiCopied ? <><Check size={12}/> Kopiert</> : <><Copy size={12}/> Kopieren</>}
            </button>
          </div>
        )}
      </div>

      {/* Entry form */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-charcoal text-lg mb-1">➕ Neue Messwerte eintragen</h3>
        <p className="text-sm text-charcoal-lighter mb-5">Tragen Sie hier die aktuellen Werte ein. Pflichtfelder sind mit * markiert.</p>

        {alertPreview.length > 0 && (
          <div className="mb-4 space-y-1">
            {alertPreview.map((m, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${m.startsWith('🚨') ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'}`}>{m}</div>
            ))}
          </div>
        )}
        {!alertPreview.length && entryForm.spo2 && (
          <div className="mb-4 flex items-center gap-2 bg-teal-50 text-teal-700 px-3 py-2 rounded-lg text-sm">✅ Alle bisher eingetragenen Werte im Normalbereich</div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Herzfrequenz / Puls * <HelpTooltip text="Herzschläge pro Minute. Normalwert: 60–100"/></label>
            <input type="number" placeholder="z.B. 75" value={entryForm.herzfrequenz} onChange={e => setEntryForm(f => ({ ...f, herzfrequenz: e.target.value }))} className={cls}/>
            <p className="text-xs text-charcoal-lighter mt-0.5">Schläge / Minute</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Atemfrequenz * <HelpTooltip text="Atemzüge pro Minute. Normalwert: 12–20"/></label>
            <input type="number" placeholder="z.B. 16" value={entryForm.atemfrequenz} onChange={e => setEntryForm(f => ({ ...f, atemfrequenz: e.target.value }))} className={cls}/>
            <p className="text-xs text-charcoal-lighter mt-0.5">Atemzüge / Minute</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Sauerstoffsättigung SpO2 * <HelpTooltip text="Sauerstoff im Blut. Normalwert: 94–100%"/></label>
            <input type="number" step="0.1" placeholder="z.B. 96" value={entryForm.spo2} onChange={e => setEntryForm(f => ({ ...f, spo2: e.target.value }))} className={cls}/>
            <p className="text-xs text-charcoal-lighter mt-0.5">Prozent (%)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Körpertemperatur * <HelpTooltip text="Normalwert: 36.0–37.5°C"/></label>
            <input type="number" step="0.1" placeholder="z.B. 36.8" value={entryForm.temperatur} onChange={e => setEntryForm(f => ({ ...f, temperatur: e.target.value }))} className={cls}/>
            <p className="text-xs text-charcoal-lighter mt-0.5">Grad Celsius (°C)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Blutdruck systolisch * <HelpTooltip text="Oberer Blutdruckwert. Normalwert: ca. 120 mmHg"/></label>
            <input type="number" placeholder="z.B. 120" value={entryForm.blutdruckSys} onChange={e => setEntryForm(f => ({ ...f, blutdruckSys: e.target.value }))} className={cls}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Blutdruck diastolisch * <HelpTooltip text="Unterer Blutdruckwert. Normalwert: ca. 80 mmHg"/></label>
            <input type="number" placeholder="z.B. 80" value={entryForm.blutdruckDia} onChange={e => setEntryForm(f => ({ ...f, blutdruckDia: e.target.value }))} className={cls}/>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Bewusstseinszustand * <HelpTooltip text="Wie ansprechbar ist der Patient?"/></label>
            <select value={entryForm.bewusstsein} onChange={e => setEntryForm(f => ({ ...f, bewusstsein: e.target.value }))} className={cls}>
              {BEWUSSTSEIN_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Beatmungsmodus * <HelpTooltip text="Aktuelle Einstellung des Beatmungsgeräts"/></label>
            <select value={entryForm.beatmungsmodus} onChange={e => setEntryForm(f => ({ ...f, beatmungsmodus: e.target.value }))} className={cls}>
              {BEATMUNG_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Lagerung * <HelpTooltip text="Aktuelle Position des Patienten"/></label>
            <select value={entryForm.lagerung} onChange={e => setEntryForm(f => ({ ...f, lagerung: e.target.value }))} className={cls}>
              {LAGERUNG_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Atemzugvolumen (ml) <HelpTooltip text="Luftmenge pro Atemzug vom Beatmungsgerät"/></label>
            <input type="number" placeholder="z.B. 500" value={entryForm.atemzugvolumen} onChange={e => setEntryForm(f => ({ ...f, atemzugvolumen: e.target.value }))} className={cls}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">PEEP (cmH₂O) <HelpTooltip text="Positiver Endexspirationsdruck — Einstellung am Beatmungsgerät. Normalwert: 5–10 cmH₂O"/></label>
            <input type="number" step="0.5" placeholder="z.B. 5" value={entryForm.peep} onChange={e => setEntryForm(f => ({ ...f, peep: e.target.value }))} className={cls}/>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Cuffdruck (mmHg) <HelpTooltip text="Druck der Trachealkanülenmanschette. Normalwert: 20–30 mmHg"/></label>
            <input type="number" placeholder="z.B. 25" value={entryForm.cuffDruck} onChange={e => setEntryForm(f => ({ ...f, cuffDruck: e.target.value }))} className={cls}/>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-charcoal mb-1">Bemerkungen</label>
          <textarea value={entryForm.bemerkungen} onChange={e => setEntryForm(f => ({ ...f, bemerkungen: e.target.value }))} rows={3} placeholder="Besonderheiten, Auffälligkeiten, Informationen für das nächste Team..." className={`${cls} resize-none`}/>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={() => createMutation.mutate(entryForm)}
            disabled={createMutation.isPending || !entryForm.herzfrequenz || !entryForm.spo2}
            className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/> : '💾'} Messwerte speichern
          </button>
          <button onClick={() => setShowOcr(s => !s)} className="flex items-center gap-2 border border-gray-200 text-charcoal px-4 py-3 rounded-xl text-sm hover:bg-gray-50">
            📷 Vom Papierformular einscannen
          </button>
        </div>

        {showOcr && (
          <div className="mt-4">
            <OcrUpload
              onScan={(data) => {
                setEntryForm(f => ({
                  ...f,
                  herzfrequenz: data.herzfrequenz ?? f.herzfrequenz,
                  spo2:         data.spo2 ?? f.spo2,
                  temperatur:   data.temperatur ?? f.temperatur,
                }))
                setShowOcr(false)
              }}
              type="monitoring"
            />
          </div>
        )}
      </div>

      {/* 24h Timeline */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-charcoal mb-1">Tagesübersicht — Alle Einträge von heute</h3>
        <p className="text-sm text-charcoal-lighter mb-4">Jedes Kästchen steht für eine Stunde. Klicken Sie auf ein Kästchen, um den Eintrag zu sehen.</p>
        <div className="grid grid-cols-12 gap-1.5">
          {allHours.map(h => { const e = entryByHour[h]; return (
            <div key={h}
              title={e ? `${h}:00 — SpO2: ${e.spo2}%` : `${h}:00 — Kein Eintrag`}
              onClick={() => e && openEdit(e)}
              className={`h-12 rounded flex items-end justify-center pb-1 transition-all ${e ? `${HOUR_COLORS[e.alertLevel] ?? 'bg-teal-400'} cursor-pointer hover:opacity-80` : 'bg-gray-100 border border-dashed border-gray-300 cursor-default'}`}
            >
              <span className={`text-xs font-medium ${e ? 'text-white' : 'text-gray-400'}`}>{h}</span>
            </div>
          )})}
        </div>
        <div className="flex gap-4 mt-3 text-xs text-charcoal-lighter flex-wrap">
          {['GRUEN','GELB','ROT'].map(l => <span key={l} className="flex items-center gap-1.5"><span className={`w-3 h-3 rounded ${HOUR_COLORS[l]}`}/>{l}</span>)}
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gray-100 border border-dashed border-gray-300"/>Kein Eintrag</span>
          <span className="text-charcoal-lighter">· Auf ein Kästchen klicken → Eintrag bearbeiten</span>
        </div>
      </div>

      {/* Entries table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b"><h3 className="font-semibold text-charcoal">Alle Einträge von heute</h3></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Uhrzeit</th>
              <th className="px-4 py-3 text-left">Puls</th>
              <th className="px-4 py-3 text-left">AF</th>
              <th className="px-4 py-3 text-left">SpO2</th>
              <th className="px-4 py-3 text-left">RR</th>
              <th className="px-4 py-3 text-left">Temp.</th>
              <th className="px-4 py-3 text-left">Zustand</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(entries ?? []).map(e => (
              <tr key={e.id} className={`hover:bg-gray-50 ${e.alertTriggered ? 'bg-red-50' : ''}`}>
                <td className="px-4 py-2.5 font-medium">{new Date(e.recordedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</td>
                <td className="px-4 py-2.5">{e.herzfrequenz}/min</td>
                <td className="px-4 py-2.5">{e.atemfrequenz}/min</td>
                <td className="px-4 py-2.5 font-semibold">{e.spo2}%</td>
                <td className="px-4 py-2.5">{e.blutdruckSys}/{e.blutdruckDia}</td>
                <td className="px-4 py-2.5">{e.temperatur}°C</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${e.alertLevel === 'ROT' ? 'bg-red-100 text-red-700' : e.alertLevel === 'GELB' ? 'bg-yellow-100 text-yellow-700' : 'bg-teal-100 text-teal-700'}`}>
                    {e.alertLevel === 'ROT' ? '🔴 Kritisch' : e.alertLevel === 'GELB' ? '🟡 Warnung' : '🟢 Normal'}
                  </span>
                </td>
                <td className="px-4 py-2.5"><button onClick={() => openEdit(e)} className="text-charcoal-lighter hover:text-teal-600"><Pencil size={14}/></button></td>
              </tr>
            ))}
            {!entries?.length && <tr><td colSpan={8} className="px-4 py-8 text-center text-charcoal-lighter">Noch keine Messwerte heute eingetragen</td></tr>}
          </tbody>
        </table>
      </div>

      {editItem && (
        <Modal title={`Eintrag bearbeiten — ${new Date(editItem.recordedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`} onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {[['herzfrequenz','Herzfrequenz / Puls'],['atemfrequenz','Atemfrequenz'],['spo2','SpO2 (%)'],['temperatur','Temperatur (°C)'],['blutdruckSys','RR systolisch'],['blutdruckDia','RR diastolisch']].map(([k, l]) => (
                <div key={k}>
                  <label className="block text-xs font-medium text-charcoal mb-1">{l}</label>
                  <input type="number" step="0.1" value={editForm[k as keyof EditForm]} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} className={cls}/>
                </div>
              ))}
            </div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Bemerkungen</label><textarea value={editForm.bemerkungen} onChange={e => setEditForm(f => ({ ...f, bemerkungen: e.target.value }))} rows={2} className={cls}/></div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditItem(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Abbrechen</button>
              <button onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending} className="px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 disabled:opacity-50">💾 {updateMutation.isPending ? 'Speichere…' : 'Änderungen speichern'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
