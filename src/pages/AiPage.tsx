import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, Copy, Check } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import api from '../lib/api'

interface Patient { id: string; vorname: string; nachname: string }

type TabType = 'schicht' | 'uebergabe' | 'mdk' | 'pflege' | 'risiko'

const TABS: { key: TabType; label: string }[] = [
  { key: 'schicht',    label: 'Schicht-Zusammenfassung' },
  { key: 'uebergabe',  label: 'Übergabe-Writer'          },
  { key: 'mdk',        label: 'MDK-Writer'               },
  { key: 'pflege',     label: 'Pflege-Writer'            },
  { key: 'risiko',     label: 'Risiko-Analyse'           },
]

const MDK_TYPES = ['Qualitätsbericht', 'Pflegebericht', 'Vorfallbericht', 'Maßnahmenplan']
const PFLEGE_TYPES = ['Pflegeziele', 'Maßnahmen', 'Beatmungsplan', 'Risikoeinschätzung', 'Ressourcen']

interface RisikoResult {
  risikolevel: 'NIEDRIG' | 'MITTEL' | 'HOCH' | 'UNBEKANNT'
  begruendung: string
  empfehlungen: string[]
}

function ResultBox({ text, onCopy }: { text: string; onCopy: () => void }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => { onCopy(); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div className="relative mt-4">
      <textarea
        readOnly
        value={text}
        rows={8}
        className="w-full border-2 border-teal-200 rounded-xl p-4 text-sm text-charcoal bg-teal-50 resize-none focus:outline-none"
      />
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 flex items-center gap-1 text-xs bg-teal-500 text-white px-2.5 py-1.5 rounded-lg hover:bg-teal-600"
      >
        {copied ? <><Check size={12}/> Kopiert</> : <><Copy size={12}/> Kopieren</>}
      </button>
    </div>
  )
}

function Spinner() {
  return <div className="animate-spin h-5 w-5 border-2 border-teal-500 border-t-transparent rounded-full" />
}

export default function AiPage() {
  const [tab, setTab] = useState<TabType>('schicht')

  // Shared state per tab
  const [patientId,  setPatientId]  = useState('')
  const [schicht,    setSchicht]    = useState('TAG')
  const [datum,      setDatum]      = useState(() => new Date().toISOString().split('T')[0])
  const [kontext,    setKontext]    = useState('')
  const [mdkTyp,     setMdkTyp]    = useState(MDK_TYPES[0])
  const [pflegeTyp,  setPflegeTyp] = useState(PFLEGE_TYPES[0])
  const [result,     setResult]     = useState('')
  const [risiko,     setRisiko]     = useState<RisikoResult | null>(null)
  const [loading,    setLoading]    = useState(false)

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn:  () => api.get<{ success: boolean; patients: Patient[] }>('/patients').then(r => r.data.patients),
  })

  const call = async (endpoint: string, payload: Record<string, string>) => {
    setLoading(true); setResult(''); setRisiko(null)
    try {
      const res = await api.post<{ success: boolean; data: { result?: string; response?: string; analyse?: string; risikolevel?: string; begruendung?: string; empfehlungen?: string[] } }>(endpoint, payload)
      const d = res.data.data
      if (endpoint.includes('predict-alert')) {
        setRisiko({
          risikolevel:   (d.risikolevel ?? 'UNBEKANNT') as RisikoResult['risikolevel'],
          begruendung:   d.begruendung ?? '',
          empfehlungen:  d.empfehlungen ?? [],
        })
      } else {
        setResult(d.result ?? d.response ?? d.analyse ?? '')
      }
    } catch {
      setResult('KI-Endpoint noch nicht verfügbar. Das Backend-Modul wird in Phase 12 hinzugefügt.')
    } finally {
      setLoading(false)
    }
  }

  const PatientSelect = () => (
    <select value={patientId} onChange={e => setPatientId(e.target.value)}
      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
      <option value="">— Patient auswählen —</option>
      {(patients ?? []).map(p => <option key={p.id} value={p.id}>{p.vorname} {p.nachname}</option>)}
    </select>
  )

  const SchichtSelect = () => (
    <select value={schicht} onChange={e => setSchicht(e.target.value)}
      className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
      <option value="TAG">TAG</option><option value="NACHT">NACHT</option>
    </select>
  )

  const TealBtn = ({ label, onClick, disabled }: { label: string; onClick: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled || loading}
      className="flex items-center gap-2 bg-teal-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-teal-600 transition-colors disabled:opacity-50">
      {loading ? <Spinner /> : <Sparkles size={16}/>} {label}
    </button>
  )

  const risikoColor = (lvl?: string) => {
    if (lvl === 'NIEDRIG') return 'bg-teal-100 text-teal-700'
    if (lvl === 'MITTEL')  return 'bg-yellow-100 text-yellow-700'
    if (lvl === 'HOCH')    return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-600'
  }

  return (
    <div>
      <PageHeader title="KI-Tools" subtitle="Donna KI-Assistenz für airflow" />

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setResult(''); setRisiko(null) }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t.key ? 'bg-teal-500 text-white' : 'bg-white text-charcoal border border-gray-200 hover:border-teal-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 max-w-2xl space-y-4">

        {tab === 'schicht' && (
          <>
            <PatientSelect/>
            <div className="flex gap-3 items-center">
              <SchichtSelect/>
              <input type="date" value={datum} onChange={e => setDatum(e.target.value)}
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400" />
            </div>
            <TealBtn label="KI-Zusammenfassung erstellen" onClick={() => call('/ai/monitoring-summary', { patientId, schicht, datum })} />
            {result && <ResultBox text={result} onCopy={() => navigator.clipboard.writeText(result)} />}
          </>
        )}

        {tab === 'uebergabe' && (
          <>
            <PatientSelect/>
            <SchichtSelect/>
            <textarea value={kontext} onChange={e => setKontext(e.target.value)} rows={3}
              placeholder="Zusätzliche Informationen (optional)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
            <TealBtn label="Übergabebericht erstellen" onClick={() => call('/ai/handover-writer', { patientId, schicht, kontext })} />
            {result && <ResultBox text={result} onCopy={() => navigator.clipboard.writeText(result)} />}
          </>
        )}

        {tab === 'mdk' && (
          <>
            <select value={mdkTyp} onChange={e => setMdkTyp(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
              {MDK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <textarea value={kontext} onChange={e => setKontext(e.target.value)} rows={3}
              placeholder="Kontext/Hinweise (optional)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
            <TealBtn label="MDK-Dokument erstellen" onClick={() => call('/ai/mdk-writer', { dokumentTyp: mdkTyp, kontext })} />
            {result && <ResultBox text={result} onCopy={() => navigator.clipboard.writeText(result)} />}
          </>
        )}

        {tab === 'pflege' && (
          <>
            <PatientSelect/>
            <select value={pflegeTyp} onChange={e => setPflegeTyp(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
              {PFLEGE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <textarea value={kontext} onChange={e => setKontext(e.target.value)} rows={3}
              placeholder="Kontext (optional)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none" />
            <TealBtn label="Text erstellen" onClick={() => call('/ai/care-writer', { patientId, feldTyp: pflegeTyp, kontext })} />
            {result && <ResultBox text={result} onCopy={() => navigator.clipboard.writeText(result)} />}
          </>
        )}

        {tab === 'risiko' && (
          <>
            <PatientSelect/>
            <TealBtn label="Risiko analysieren" onClick={() => call('/ai/predict-alert', { patientId })} />
            {risiko && (
              <div className="mt-4 space-y-3">
                <div className={`inline-block px-5 py-2.5 rounded-full text-lg font-bold ${risikoColor(risiko.risikolevel)}`}>
                  {risiko.risikolevel}
                </div>
                {risiko.begruendung && <p className="text-sm text-charcoal">{risiko.begruendung}</p>}
                {risiko.empfehlungen.length > 0 && (
                  <ul className="space-y-1">
                    {risiko.empfehlungen.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-charcoal">
                        <span className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"/>
                        {e}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
