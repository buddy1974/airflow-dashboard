import { useState, useRef, ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Upload, CheckCircle, SkipForward, AlertCircle, Copy } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import GuidedStep from '../components/GuidedStep'
import UploadZone from '../components/UploadZone'
import OcrUpload from '../components/OcrUpload'
import api from '../lib/api'

interface Patient { id: string; vorname: string; nachname: string }
interface PreviewRow { [key: string]: string }
interface PreviewData { columns: string[]; rows: PreviewRow[]; mappings: { source: string; target: string; status: 'ok' | 'warning' }[]; warnings: string[] }
interface ImportResult { imported: number; skipped: number; errors: number; alerts?: number; errorDetails?: string[]; credentials?: { email: string; tempPassword: string }[] }

const IMPORT_STEPS = [
  { number: 1, title: 'Vorlage herunterladen', description: 'Laden Sie unsere Vorlage herunter — sie zeigt Ihnen, wie Ihre Tabelle aufgebaut sein soll.' },
  { number: 2, title: 'Vorlage ausfüllen', description: 'Füllen Sie die Vorlage aus — oder nutzen Sie Ihre bestehende Excel-Datei direkt.' },
  { number: 3, title: 'Datei hochladen', description: 'Laden Sie die Datei hoch — wir lesen alles automatisch ein und zeigen Ihnen eine Vorschau.' },
  { number: 4, title: 'Import bestätigen', description: 'Bestätigen Sie den Import — und alle Daten sind sofort im System.' },
]

function ImportSection({ title, description, icon, typ, patientId, schicht, patients }: {
  title: string; description: string; icon: string; typ: string
  patientId?: string; schicht?: string
  patients?: Patient[]
}) {
  const [file,      setFile]      = useState<File | null>(null)
  const [preview,   setPreview]   = useState<PreviewData | null>(null)
  const [result,    setResult]    = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [errOpen,   setErrOpen]   = useState(false)
  const [copyMsg,   setCopyMsg]   = useState('')
  const [localPat,  setLocalPat]  = useState('')
  const [localSch,  setLocalSch]  = useState('TAG')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (f: File) => {
    setFile(f); setPreview(null); setResult(null)
    const fd = new FormData(); fd.append('file', f); fd.append('typ', typ)
    try {
      const res = await api.post<{ success: boolean; preview: PreviewData }>('/import/preview', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setPreview(res.data.preview)
    } catch {
      setPreview({ columns: [], rows: [], mappings: [], warnings: ['Vorschau nicht verfügbar — Datei wird beim Import geprüft.'] })
    }
  }

  const runImport = async () => {
    if (!file) return
    setImporting(true); setResult(null)
    const fd = new FormData(); fd.append('file', file); fd.append('typ', typ)
    if (typ === 'monitoring') { fd.append('patientId', localPat || patientId || ''); fd.append('schicht', localSch || schicht || 'TAG') }
    try {
      const res = await api.post<{ success: boolean; result: ImportResult }>('/import/run', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResult(res.data.result)
    } catch {
      setResult({ imported: 0, skipped: 0, errors: 1, errorDetails: ['Import fehlgeschlagen — bitte Dateiformat prüfen.'] })
    } finally {
      setImporting(false)
    }
  }

  const cls = "border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
      <div className="flex items-center gap-4 px-6 py-5 bg-teal-50 border-b">
        <span className="text-4xl">{icon}</span>
        <div>
          <h3 className="font-bold text-charcoal text-lg">{title}</h3>
          <p className="text-sm text-charcoal-lighter">{description}</p>
        </div>
      </div>
      <div className="p-6 space-y-5">
        <GuidedStep steps={IMPORT_STEPS} current={file ? (preview ? 4 : 3) : 1}/>

        <div className="flex items-center gap-3">
          <button onClick={() => {
            const url = `https://airflow-backend-oyff.onrender.com/api/import/template/${typ}`
            const a = document.createElement('a'); a.href = url; a.setAttribute('download', `vorlage_${typ}.xlsx`); a.setAttribute('target', '_blank'); document.body.appendChild(a); a.click(); a.remove()
          }} className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-teal-600">
            <Download size={16}/> 📥 Vorlage herunterladen
          </button>
        </div>

        {typ === 'monitoring' && (
          <div className="flex gap-3">
            <select value={localPat} onChange={e => setLocalPat(e.target.value)} className={`flex-1 ${cls}`}>
              <option value="">— Patient auswählen (für Zuordnung) —</option>
              {(patients ?? []).map(p => <option key={p.id} value={p.id}>{p.vorname} {p.nachname}</option>)}
            </select>
            <select value={localSch} onChange={e => setLocalSch(e.target.value)} className={cls}>
              <option value="TAG">Tagschicht</option><option value="NACHT">Nachtschicht</option>
            </select>
          </div>
        )}

        <UploadZone label={`Ihre ${title.split(' ')[0]}-Datei hier ablegen`} onFile={handleFile} loading={false}/>

        {preview && (
          <div className="space-y-2">
            {preview.warnings.map((w, i) => (
              <div key={i} className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700"><AlertCircle size={14}/> {w}</div>
            ))}
            {preview.mappings.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {preview.mappings.map((m, i) => (
                  <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.status === 'ok' ? 'bg-teal-100 text-teal-700' : 'bg-yellow-100 text-yellow-700'}`}>{m.source} → {m.target}</span>
                ))}
              </div>
            )}
            {preview.rows.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                  <thead className="bg-gray-50"><tr>{preview.columns.map(c => <th key={c} className="px-3 py-2 text-left text-charcoal-lighter">{c}</th>)}</tr></thead>
                  <tbody>{preview.rows.slice(0, 5).map((row, i) => <tr key={i}>{preview.columns.map(c => <td key={c} className="px-3 py-1.5">{row[c] ?? '—'}</td>)}</tr>)}</tbody>
                </table>
                <p className="text-xs text-charcoal-lighter mt-1">Vorschau: erste 5 Zeilen</p>
              </div>
            )}
          </div>
        )}

        {file && (
          <button onClick={runImport} disabled={importing || (typ === 'monitoring' && !localPat)}
            className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white py-3.5 rounded-xl font-semibold hover:bg-teal-600 transition-colors disabled:opacity-50">
            {importing ? <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>Importiere Daten…</> : <><Upload size={16}/>📥 Import jetzt starten</>}
          </button>
        )}

        {result && (
          <div className="space-y-3 bg-gray-50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 bg-teal-50 rounded-xl p-3"><CheckCircle size={20} className="text-teal-500"/><div><p className="font-bold text-teal-700 text-lg">{result.imported}</p><p className="text-xs text-teal-600">✅ Erfolgreich importiert</p></div></div>
              <div className="flex items-center gap-2 bg-gray-100 rounded-xl p-3"><SkipForward size={20} className="text-gray-400"/><div><p className="font-bold text-gray-600 text-lg">{result.skipped}</p><p className="text-xs text-gray-500">⏭ Bereits vorhanden</p></div></div>
              <div className="flex items-center gap-2 bg-red-50 rounded-xl p-3"><AlertCircle size={20} className="text-red-400"/><div><p className="font-bold text-red-600 text-lg">{result.errors}</p><p className="text-xs text-red-500">❌ Fehler</p></div></div>
              {result.alerts !== undefined && <div className="flex items-center gap-2 bg-yellow-50 rounded-xl p-3"><AlertCircle size={20} className="text-yellow-500"/><div><p className="font-bold text-yellow-700 text-lg">{result.alerts}</p><p className="text-xs text-yellow-600">🔔 Alerts ausgelöst</p></div></div>}
            </div>
            {result.errorDetails && result.errorDetails.length > 0 && (
              <div>
                <button onClick={() => setErrOpen(o => !o)} className="text-sm text-red-600 flex items-center gap-1"><AlertCircle size={14}/>{errOpen ? 'Fehler ausblenden' : `⚠️ ${result.errorDetails.length} Fehler anzeigen`}</button>
                {errOpen && <div className="mt-2 bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">{result.errorDetails.map((e, i) => <p key={i}>• {e}</p>)}</div>}
              </div>
            )}
            {result.credentials && result.credentials.length > 0 && (
              <div>
                <p className="font-semibold text-charcoal mb-2">🔑 Zugangsdaten für neue Mitarbeiter</p>
                {copyMsg && <p className="text-xs text-teal-600 mb-1">{copyMsg}</p>}
                <table className="w-full text-xs border border-gray-100 rounded-xl overflow-hidden">
                  <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">E-Mail</th><th className="px-3 py-2 text-left">Passwort</th><th className="px-3 py-2"></th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {result.credentials.map((c, i) => <tr key={i}><td className="px-3 py-2">{c.email}</td><td className="px-3 py-2 font-mono">{c.tempPassword}</td><td className="px-3 py-2"><button onClick={async () => { await navigator.clipboard.writeText(`${c.email} / ${c.tempPassword}`); setCopyMsg('Kopiert!'); setTimeout(() => setCopyMsg(''), 2000) }} className="text-teal-500 hover:text-teal-600"><Copy size={13}/></button></td></tr>)}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ImportPage() {
  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: () => api.get<{ success: boolean; patients: Patient[] }>('/patients').then(r => r.data.patients) })

  return (
    <div>
      <PageHeader title="Datenimport" subtitle="Übertragen Sie Ihre bisherigen Daten in das System — mit einem Klick. Wir unterstützen Excel-Tabellen, Word-Dokumente und eingescannte Formulare."/>

      <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5 mb-6">
        <p className="font-semibold text-teal-700 mb-3">💡 So funktioniert der Import — in 4 einfachen Schritten:</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-teal-700">
          {['1. Vorlage herunterladen', '2. Mit Ihren Daten ausfüllen', '3. Datei hochladen', '4. Import bestätigen'].map((s, i) => (
            <div key={i} className="flex items-start gap-2"><span className="font-bold">{s.split('.')[0]}.</span><span>{s.split('. ')[1]}</span></div>
          ))}
        </div>
      </div>

      <ImportSection icon="📊" title="Überwachungsprotokolle importieren" description="Haben Sie ausgefüllte Überwachungsprotokolle als Excel-Datei? Laden Sie diese hoch — wir importieren alle Messwerte automatisch." typ="monitoring" patients={patients}/>
      <ImportSection icon="👥" title="Patientenliste importieren" description="Haben Sie eine Excel-Tabelle mit Ihren Patientendaten? Laden Sie diese hoch — alle Patienten werden automatisch angelegt." typ="patienten"/>
      <ImportSection icon="💊" title="Medikamentenliste importieren" description="Laden Sie eine Liste der Medikamente für einen Patienten hoch." typ="medikamente" patients={patients}/>
      <ImportSection icon="👩‍⚕️" title="Mitarbeiterliste importieren" description="Laden Sie Ihre Mitarbeiterliste hoch. Jeder Mitarbeiter erhält automatisch einen Zugang zum System." typ="mitarbeiter"/>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h3 className="font-bold text-charcoal text-lg mb-2">📷 Dokumente & Formulare einscannen</h3>
        <p className="text-sm text-charcoal-lighter mb-5">Haben Sie ausgefüllte Papierformulare, handschriftliche Notizen oder eingescannte Dokumente? Laden Sie ein Foto hoch — unsere KI liest den Inhalt automatisch aus.</p>
        <OcrUpload onScan={(data) => console.log('OCR scan result:', data)} label="Papierformular scannen — wir lesen es automatisch ein"/>
        <p className="text-xs text-charcoal-lighter mt-3">Unterstützt: Fotos (.jpg, .png), PDF-Dateien, eingescannte Formulare, handschriftliche Überwachungsprotokolle</p>
      </div>
    </div>
  )
}
