import { useState, useRef, ChangeEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download, Upload, CheckCircle, SkipForward, AlertCircle, Copy } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import api from '../lib/api'

interface Patient { id: string; vorname: string; nachname: string }

interface PreviewRow { [key: string]: string }
interface PreviewData {
  columns: string[]
  rows: PreviewRow[]
  mappings: { source: string; target: string; status: 'ok' | 'warning' }[]
  warnings: string[]
}
interface ImportResult {
  imported: number
  skipped:  number
  errors:   number
  alerts?:  number
  errorDetails?: string[]
  credentials?: { email: string; tempPassword: string }[]
}

type TabType = 'monitoring' | 'patienten' | 'medikamente' | 'mitarbeiter'

const TABS: { key: TabType; label: string }[] = [
  { key: 'monitoring',   label: 'Überwachungsprotokoll' },
  { key: 'patienten',    label: 'Patienten'             },
  { key: 'medikamente',  label: 'Medikamente'           },
  { key: 'mitarbeiter',  label: 'Mitarbeiter'           },
]

function DandelionUpload() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="text-teal-400">
      <circle cx="24" cy="24" r="4.5" fill="currentColor" opacity="0.5" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x2 = 24 + 17 * Math.cos(rad), y2 = 24 + 17 * Math.sin(rad)
        return <circle key={deg} cx={x2} cy={y2} r="3" fill="currentColor" opacity="0.4" />
      })}
    </svg>
  )
}

export default function ImportPage() {
  const [tab, setTab]           = useState<TabType>('monitoring')
  const [file, setFile]         = useState<File | null>(null)
  const [preview, setPreview]   = useState<PreviewData | null>(null)
  const [result, setResult]     = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [patientId, setPatientId] = useState('')
  const [schicht, setSchicht]   = useState('TAG')
  const [errorsOpen, setErrorsOpen] = useState(false)
  const [copyMsg, setCopyMsg]   = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn:  () => api.get<{ success: boolean; patients: Patient[] }>('/patients').then(r => r.data.patients),
  })

  // Reset state when switching tabs
  const switchTab = (t: TabType) => {
    setTab(t); setFile(null); setPreview(null); setResult(null)
  }

  const downloadTemplate = () => {
    const url = `https://airflow-backend-oyff.onrender.com/api/import/template/${tab}`
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `vorlage_${tab}.xlsx`)
    link.setAttribute('target', '_blank')
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f); setPreview(null); setResult(null)
    const fd = new FormData()
    fd.append('file', f)
    fd.append('typ', tab)
    try {
      const res = await api.post<{ success: boolean; preview: PreviewData }>('/import/preview', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setPreview(res.data.preview)
    } catch {
      setPreview({ columns: [], rows: [], mappings: [], warnings: ['Vorschau nicht verfügbar — Datei wird trotzdem importiert.'] })
    }
  }

  const runImport = async () => {
    if (!file) return
    setImporting(true); setResult(null)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('typ', tab)
    if (tab === 'monitoring') { fd.append('patientId', patientId); fd.append('schicht', schicht) }
    try {
      const res = await api.post<{ success: boolean; result: ImportResult }>('/import/run', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(res.data.result)
    } catch {
      setResult({ imported: 0, skipped: 0, errors: 1, errorDetails: ['Import fehlgeschlagen — bitte Format prüfen.'] })
    } finally {
      setImporting(false)
    }
  }

  const copyCredentials = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopyMsg('Kopiert!'); setTimeout(() => setCopyMsg(''), 2000)
  }

  return (
    <div>
      <PageHeader title="Datenimport" subtitle="Historische Daten in einem Klick importieren" />

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => switchTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-teal-500 text-white' : 'bg-white text-charcoal border border-gray-200 hover:border-teal-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Step 1 — Template */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-3">Schritt 1 — Vorlage</p>
          <button onClick={downloadTemplate}
            className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-600 transition-colors">
            <Download size={16} /> Vorlage herunterladen
          </button>
        </div>

        {/* Step 2 — Upload */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-3">Schritt 2 — Datei hochladen</p>

          {tab === 'monitoring' && (
            <div className="flex gap-3 mb-4">
              <select value={patientId} onChange={e => setPatientId(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="">— Patient auswählen —</option>
                {(patients ?? []).map(p => <option key={p.id} value={p.id}>{p.vorname} {p.nachname}</option>)}
              </select>
              <select value={schicht} onChange={e => setSchicht(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
                <option value="TAG">TAG</option>
                <option value="NACHT">NACHT</option>
              </select>
            </div>
          )}

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-teal-300 rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer hover:bg-teal-50 transition-colors"
          >
            <DandelionUpload />
            <p className="text-sm text-charcoal-lighter text-center">
              {file ? <span className="text-teal-600 font-medium">{file.name}</span> : 'Excel-Datei hier ablegen oder klicken zum Auswählen'}
            </p>
            <p className="text-xs text-charcoal-lighter">.xlsx · .xls · .csv</p>
          </div>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFileChange} />

          {/* Preview */}
          {preview && (
            <div className="mt-4 space-y-2">
              {preview.warnings.map((w, i) => (
                <div key={i} className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-xs text-yellow-700">
                  <AlertCircle size={14}/> {w}
                </div>
              ))}
              {preview.mappings.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {preview.mappings.map((m, i) => (
                    <span key={i} className={`text-xs px-2 py-0.5 rounded-full font-medium ${m.status === 'ok' ? 'bg-teal-100 text-teal-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {m.source} → {m.target}
                    </span>
                  ))}
                </div>
              )}
              {preview.rows.length > 0 && (
                <div className="overflow-x-auto mt-2">
                  <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                      <tr>{preview.columns.map(c => <th key={c} className="px-3 py-2 text-left text-charcoal-lighter">{c}</th>)}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {preview.rows.slice(0, 5).map((row, i) => (
                        <tr key={i}>{preview.columns.map(c => <td key={c} className="px-3 py-1.5 text-charcoal">{row[c] ?? '—'}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-charcoal-lighter mt-1">Vorschau: erste 5 Zeilen</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 3 — Import */}
        {file && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-3">Schritt 3 — Importieren</p>
            <button
              onClick={runImport}
              disabled={importing || (tab === 'monitoring' && !patientId)}
              className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white py-3 rounded-xl font-semibold text-sm hover:bg-teal-600 transition-colors disabled:opacity-50"
            >
              {importing ? <><div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> Importiere…</> : <><Upload size={16}/> Import starten</>}
            </button>

            {result && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 bg-teal-50 rounded-lg px-4 py-3">
                    <CheckCircle size={18} className="text-teal-500"/><div><p className="font-bold text-teal-700">{result.imported}</p><p className="text-xs text-teal-600">Importiert</p></div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-3">
                    <SkipForward size={18} className="text-gray-400"/><div><p className="font-bold text-gray-600">{result.skipped}</p><p className="text-xs text-gray-500">Übersprungen</p></div>
                  </div>
                  <div className="flex items-center gap-2 bg-red-50 rounded-lg px-4 py-3">
                    <AlertCircle size={18} className="text-red-400"/><div><p className="font-bold text-red-600">{result.errors}</p><p className="text-xs text-red-500">Fehler</p></div>
                  </div>
                  {result.alerts !== undefined && (
                    <div className="flex items-center gap-2 bg-yellow-50 rounded-lg px-4 py-3">
                      <AlertCircle size={18} className="text-yellow-500"/><div><p className="font-bold text-yellow-700">{result.alerts}</p><p className="text-xs text-yellow-600">Alerts</p></div>
                    </div>
                  )}
                </div>

                {result.errorDetails && result.errorDetails.length > 0 && (
                  <div>
                    <button onClick={() => setErrorsOpen(o => !o)} className="text-sm text-red-600 flex items-center gap-1">
                      <AlertCircle size={14}/> {errorsOpen ? 'Fehler ausblenden' : 'Fehler anzeigen'}
                    </button>
                    {errorsOpen && (
                      <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-700 space-y-1 max-h-40 overflow-y-auto">
                        {result.errorDetails.map((e, i) => <p key={i}>• {e}</p>)}
                      </div>
                    )}
                  </div>
                )}

                {result.credentials && result.credentials.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-charcoal mb-2">Zugangsdaten neue Mitarbeiter</p>
                    {copyMsg && <p className="text-xs text-teal-600 mb-1">{copyMsg}</p>}
                    <table className="w-full text-xs border border-gray-100 rounded-lg overflow-hidden">
                      <thead className="bg-gray-50"><tr><th className="px-3 py-2 text-left">E-Mail</th><th className="px-3 py-2 text-left">Temp-Passwort</th><th className="px-3 py-2"></th></tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {result.credentials.map((c, i) => (
                          <tr key={i}>
                            <td className="px-3 py-2">{c.email}</td>
                            <td className="px-3 py-2 font-mono">{c.tempPassword}</td>
                            <td className="px-3 py-2">
                              <button onClick={() => copyCredentials(`${c.email} / ${c.tempPassword}`)} className="text-teal-500 hover:text-teal-600">
                                <Copy size={13}/>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
