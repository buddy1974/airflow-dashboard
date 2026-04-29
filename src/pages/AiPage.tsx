import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Sparkles, Copy, Check, Send } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import AiWriteButton from '../components/AiWriteButton'
import api from '../lib/api'

interface Patient { id: string; vorname: string; nachname: string }
type TabType = 'chat' | 'schicht' | 'uebergabe' | 'mdk' | 'pflege' | 'risiko'

const SUGGESTION_CHIPS = [
  'Schreibe einen Übergabebericht für den ersten Patienten',
  'Was bedeutet SpO2 unter 90%?',
  'Erstelle einen MDK-Qualitätsbericht',
  'Welche Schulungen laufen diesen Monat ab?',
  'Erkläre mir die PEEP-Einstellung',
]

const MDK_TYPES    = ['Qualitätsbericht','Pflegebericht','Vorfallbericht','Maßnahmenplan']
const PFLEGE_TYPES = ['Pflegeziele','Maßnahmen','Beatmungsplan','Risikoeinschätzung','Ressourcenplanung']

function CopyableResult({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <div className="mt-4 relative">
      <div className="border-2 border-teal-200 rounded-xl p-4 bg-teal-50">
        <p className="text-xs text-teal-600 font-semibold mb-2">✨ KI-Ergebnis — Sie können den Text unten bearbeiten, bevor Sie ihn speichern:</p>
        <p className="text-sm text-charcoal leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
      <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        className="absolute top-3 right-3 flex items-center gap-1 text-xs bg-teal-500 text-white px-2.5 py-1.5 rounded-lg hover:bg-teal-600">
        {copied ? <><Check size={12}/> Kopiert!</> : <><Copy size={12}/> 📋 Text kopieren</>}
      </button>
    </div>
  )
}

export default function AiPage() {
  const [tab, setTab] = useState<TabType>('chat')
  const [chat, setChat] = useState<{ role: 'user' | 'donna'; text: string }[]>([
    { role: 'donna', text: 'Hallo! Ich bin Donna — Ihre KI-Assistentin für airflow. Ich kann Ihnen helfen, Berichte zu schreiben, Fragen zu beantworten oder Daten zu analysieren. Was kann ich für Sie tun?' }
  ])
  const [input,    setInput]    = useState('')
  const [patId,    setPatId]    = useState('')
  const [schicht,  setSchicht]  = useState('TAG')
  const [kontext,  setKontext]  = useState('')
  const [mdkTyp,   setMdkTyp]   = useState(MDK_TYPES[0])
  const [pfTyp,    setPfTyp]    = useState(PFLEGE_TYPES[0])
  const [result,   setResult]   = useState('')
  const [risiko,   setRisiko]   = useState<{ risikolevel: string; begruendung: string; empfehlungen: string[] } | null>(null)
  const [loading,  setLoading]  = useState(false)

  const { data: patients } = useQuery({ queryKey: ['patients'], queryFn: () => api.get<{ success: boolean; patients: Patient[] }>('/patients').then(r => r.data.patients) })

  const sendChat = async (msg?: string) => {
    const text = (msg ?? input).trim()
    if (!text) return
    setChat(c => [...c, { role: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const res = await api.post<{ success: boolean; data: { response?: string; result?: string } }>('/pdl/command', { command: text })
      setChat(c => [...c, { role: 'donna', text: res.data.data.response ?? res.data.data.result ?? 'Keine Antwort.' }])
    } catch {
      setChat(c => [...c, { role: 'donna', text: 'Ich bin momentan nicht erreichbar. Bitte versuchen Sie es später erneut.' }])
    } finally {
      setLoading(false)
    }
  }

  const call = async (endpoint: string, payload: Record<string, string>) => {
    setLoading(true); setResult(''); setRisiko(null)
    try {
      const res = await api.post<{ success: boolean; data: Record<string, unknown> }>(endpoint, payload)
      const d = res.data.data
      if (endpoint.includes('predict-alert')) {
        setRisiko({ risikolevel: String(d.risikolevel ?? 'UNBEKANNT'), begruendung: String(d.begruendung ?? ''), empfehlungen: Array.isArray(d.empfehlungen) ? d.empfehlungen.map(String) : [] })
      } else {
        setResult(String(d.result ?? d.response ?? d.analyse ?? 'KI-Endpoint noch nicht verfügbar (Phase 12 Backend).'))
      }
    } catch {
      setResult('Diese KI-Funktion ist noch nicht aktiv. Das Backend-Modul wird demnächst hinzugefügt.')
    } finally {
      setLoading(false)
    }
  }

  const riskColor = (lvl: string) => lvl === 'HOCH' ? 'bg-red-100 text-red-700' : lvl === 'MITTEL' ? 'bg-yellow-100 text-yellow-700' : 'bg-teal-100 text-teal-700'

  const PatSel = () => (
    <select value={patId} onChange={e => setPatId(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
      <option value="">— Patient auswählen —</option>
      {(patients ?? []).map(p => <option key={p.id} value={p.id}>{p.vorname} {p.nachname}</option>)}
    </select>
  )
  const SchSel = () => (
    <select value={schicht} onChange={e => setSchicht(e.target.value)} className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
      <option value="TAG">Tagschicht</option><option value="NACHT">Nachtschicht</option>
    </select>
  )
  const Txt = () => (
    <textarea value={kontext} onChange={e => setKontext(e.target.value)} rows={2} placeholder="Zusätzlicher Kontext oder Hinweise (optional)" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 resize-none"/>
  )

  const TABS: { key: TabType; label: string }[] = [
    { key: 'chat',     label: '💬 Chat mit Donna' },
    { key: 'schicht',  label: '📊 Schicht-Zusammenfassung' },
    { key: 'uebergabe',label: '📝 Übergabe-Writer' },
    { key: 'mdk',      label: '📋 MDK-Dokument' },
    { key: 'pflege',   label: '📄 Pflegeplan-Text' },
    { key: 'risiko',   label: '🔮 Risiko-Analyse' },
  ]

  return (
    <div>
      <PageHeader title="✨ KI-Assistent — Donna" subtitle="Donna ist Ihre persönliche KI-Assistentin. Sie schreibt Berichte, analysiert Daten und hilft Ihnen bei der täglichen Dokumentation — schnell und professionell."/>

      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setResult(''); setRisiko(null) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === t.key ? 'bg-teal-500 text-white' : 'bg-white text-charcoal border border-gray-200 hover:border-teal-300'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'chat' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col" style={{ height: '580px' }}>
          <div className="flex items-center gap-3 px-5 py-4 border-b bg-teal-50">
            <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white"><Sparkles size={20}/></div>
            <div><p className="font-semibold text-charcoal">Donna · KI-Assistentin</p><p className="text-xs text-charcoal-lighter">Für airflow Fachpflegedienst Krefeld</p></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chat.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === 'user' ? 'bg-teal-500 text-white rounded-br-none' : 'bg-gray-100 text-charcoal rounded-bl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-gray-100 rounded-2xl px-4 py-2.5 text-sm text-charcoal-lighter rounded-bl-none">Donna denkt…</div></div>}
          </div>
          <div className="border-t p-3 space-y-2">
            <div className="flex gap-2 flex-wrap">
              {SUGGESTION_CHIPS.map((s, i) => (
                <button key={i} onClick={() => sendChat(s)} className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 px-3 py-1.5 rounded-full border border-teal-200 transition-colors">{s}</button>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendChat()}
                placeholder="Stellen Sie Donna eine Frage oder geben Sie einen Auftrag…"
                className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"/>
              <button onClick={() => sendChat()} disabled={loading || !input.trim()} className="bg-teal-500 text-white rounded-full p-2.5 hover:bg-teal-600 transition-colors disabled:opacity-50"><Send size={18}/></button>
            </div>
          </div>
        </div>
      )}

      {tab !== 'chat' && (
        <div className="bg-white rounded-2xl shadow-sm p-6 max-w-2xl space-y-4">
          {tab === 'schicht' && (<>
            <PatSel/><div className="flex gap-3 items-center"><SchSel/><input type="date" defaultValue={new Date().toISOString().split('T')[0]} className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"/></div>
            <AiWriteButton label="KI-Zusammenfassung erstellen" onClick={() => call('/ai/monitoring-summary', { patientId: patId, schicht, datum: new Date().toISOString().split('T')[0] })} loading={loading}/>
          </>)}
          {tab === 'uebergabe' && (<><PatSel/><SchSel/><Txt/><AiWriteButton label="Übergabebericht erstellen" onClick={() => call('/ai/handover-writer', { patientId: patId, schicht, kontext })} loading={loading}/></>)}
          {tab === 'mdk' && (<>
            <select value={mdkTyp} onChange={e => setMdkTyp(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">{MDK_TYPES.map(t => <option key={t}>{t}</option>)}</select>
            <Txt/><AiWriteButton label="MDK-Dokument erstellen" onClick={() => call('/ai/mdk-writer', { dokumentTyp: mdkTyp, kontext })} loading={loading}/>
          </>)}
          {tab === 'pflege' && (<>
            <PatSel/>
            <select value={pfTyp} onChange={e => setPfTyp(e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">{PFLEGE_TYPES.map(t => <option key={t}>{t}</option>)}</select>
            <Txt/><AiWriteButton label="Text schreiben" onClick={() => call('/ai/care-writer', { patientId: patId, feldTyp: pfTyp, kontext })} loading={loading}/>
          </>)}
          {tab === 'risiko' && (<>
            <PatSel/>
            <p className="text-sm text-charcoal-lighter">Die KI analysiert die Vitalwert-Trends der letzten 24 Stunden und warnt Sie vor möglichen Verschlechterungen.</p>
            <AiWriteButton label="Risiko analysieren" onClick={() => call('/ai/predict-alert', { patientId: patId })} loading={loading} disabled={!patId}/>
            {risiko && (
              <div className="mt-4 space-y-3">
                <div className={`inline-block px-5 py-3 rounded-full text-lg font-bold ${riskColor(risiko.risikolevel)}`}>{risiko.risikolevel === 'HOCH' ? '🔴' : risiko.risikolevel === 'MITTEL' ? '🟡' : '🟢'} Risikolevel: {risiko.risikolevel}</div>
                {risiko.begruendung && <p className="text-sm text-charcoal leading-relaxed">{risiko.begruendung}</p>}
                {risiko.empfehlungen.length > 0 && (
                  <ul className="space-y-1.5">{risiko.empfehlungen.map((e, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-charcoal"><span className="w-2 h-2 bg-teal-500 rounded-full mt-1.5 flex-shrink-0"/>{e}</li>
                  ))}</ul>
                )}
              </div>
            )}
          </>)}
          {result && <CopyableResult text={result}/>}
        </div>
      )}
    </div>
  )
}
