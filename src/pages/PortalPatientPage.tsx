import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Send, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

interface MonEntry   { id: string; recordedAt: string; spo2: number; herzfrequenz: number; temperatur: number; bewusstsein: string; alertLevel: string }
interface Medication { id: string; wirkstoff: string; dosierung: string; haeufigkeit: string }
interface Message    { id: string; inhalt: string; vonAngehoerigen: boolean; createdAt: string; absender?: string }
interface PatientInfo {
  id: string; vorname: string; nachname: string; diagnoseHaupt: string; pflegegrad: string
  latestEntry?: { spo2: number; herzfrequenz: number; temperatur: number; alertLevel: string }
  medications?: Medication[]
}

export default function PortalPatientPage() {
  const { id } = useParams<{ id: string }>()
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()
  const [tab,  setTab]  = useState<'overview' | 'monitoring' | 'messages'>('overview')
  const [msg,  setMsg]  = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => { if (!token) navigate('/portal/login', { replace: true }) }, [token, navigate])

  const { data: patient } = useQuery({
    queryKey: ['portal-patient', id],
    queryFn:  () => api.get<{ success: boolean; patient: PatientInfo }>(`/portal/patient/${id}`).then(r => r.data.patient).catch(() => null),
    enabled: !!id && !!token,
  })

  const { data: entries } = useQuery({
    queryKey: ['portal-monitoring', id],
    queryFn:  () => api.get<{ success: boolean; entries: MonEntry[] }>(`/portal/patient/${id}/monitoring`).then(r => r.data.entries).catch(() => [] as MonEntry[]),
    enabled: tab === 'monitoring' && !!id,
  })

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['portal-messages', id],
    queryFn:  () => api.get<{ success: boolean; nachrichten: Message[] }>(`/portal/patient/${id}/nachrichten`).then(r => r.data.nachrichten).catch(() => [] as Message[]),
    enabled: tab === 'messages' && !!id,
    refetchInterval: tab === 'messages' ? 15000 : false,
  })

  const sendMessage = async () => {
    if (!msg.trim() || !id) return
    setSending(true)
    try {
      await api.post(`/portal/patient/${id}/nachrichten`, { inhalt: msg })
      setMsg('')
      refetchMessages()
    } catch { /* show nothing */ } finally { setSending(false) }
  }

  const rowColor = (level: string) =>
    level === 'ROT' ? 'bg-red-50' : level === 'GELB' ? 'bg-yellow-50' : 'bg-teal-50'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-teal-500 text-white px-6 py-4 flex items-center justify-between shadow flex-shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/portal/dashboard" className="text-teal-100 hover:text-white"><ArrowLeft size={20}/></Link>
          <div>
            <h1 className="font-bold">{patient ? `${patient.vorname} ${patient.nachname}` : 'Patient'}</h1>
            <p className="text-xs text-teal-100">{patient?.diagnoseHaupt}</p>
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/portal/login') }}
          className="flex items-center gap-1.5 text-sm text-teal-100 hover:text-white">
          <LogOut size={16}/> {user?.name}
        </button>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b flex flex-shrink-0">
        {[['overview', 'Übersicht'], ['monitoring', 'Monitoring'], ['messages', 'Nachrichten']] .map(([key, label]) => (
          <button key={key} onClick={() => setTab(key as typeof tab)}
            className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${tab === key ? 'border-teal-500 text-teal-600' : 'border-transparent text-charcoal-lighter hover:text-charcoal'}`}>
            {label}
          </button>
        ))}
      </div>

      <main className="flex-1 overflow-y-auto p-5 max-w-2xl mx-auto w-full">

        {tab === 'overview' && patient && (
          <div className="space-y-4">
            {/* Patient card */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h2 className="font-bold text-charcoal text-lg">{patient.vorname} {patient.nachname}</h2>
              <p className="text-sm text-charcoal-lighter mt-1">{patient.diagnoseHaupt}</p>
              <div className="mt-2 text-sm"><span className="font-medium text-teal-600">Pflegegrad:</span> {patient.pflegegrad}</div>
            </div>
            {/* Latest vitals */}
            {patient.latestEntry && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-semibold text-charcoal mb-3">Aktuelle Vitalzeichen</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-teal-50 rounded-lg p-3"><p className="text-xs text-teal-600">SpO₂</p><p className="font-bold text-xl">{patient.latestEntry.spo2}%</p></div>
                  <div className="bg-teal-50 rounded-lg p-3"><p className="text-xs text-teal-600">Herzfrequenz</p><p className="font-bold text-xl">{patient.latestEntry.herzfrequenz}/min</p></div>
                  <div className="bg-teal-50 rounded-lg p-3"><p className="text-xs text-teal-600">Temperatur</p><p className="font-bold text-xl">{patient.latestEntry.temperatur}°C</p></div>
                  <div className={`rounded-lg p-3 ${patient.latestEntry.alertLevel === 'ROT' ? 'bg-red-50' : patient.latestEntry.alertLevel === 'GELB' ? 'bg-yellow-50' : 'bg-teal-50'}`}>
                    <p className="text-xs text-charcoal-lighter">Zustand</p>
                    <p className="font-bold text-lg">{patient.latestEntry.alertLevel}</p>
                  </div>
                </div>
              </div>
            )}
            {/* Medications */}
            {patient.medications && patient.medications.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-semibold text-charcoal mb-3">Aktive Medikamente</h3>
                <div className="space-y-2">
                  {patient.medications.map(m => (
                    <div key={m.id} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                      <span className="font-medium text-charcoal">{m.wirkstoff}</span>
                      <span className="text-charcoal-lighter">{m.dosierung} · {m.haeufigkeit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'monitoring' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Zeit</th>
                  <th className="px-4 py-3 text-left">SpO₂</th>
                  <th className="px-4 py-3 text-left">Herzfreq.</th>
                  <th className="px-4 py-3 text-left">Temp.</th>
                  <th className="px-4 py-3 text-left">Zustand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(entries ?? []).map(e => (
                  <tr key={e.id} className={rowColor(e.alertLevel)}>
                    <td className="px-4 py-2.5">{new Date(e.recordedAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-4 py-2.5 font-semibold">{e.spo2}%</td>
                    <td className="px-4 py-2.5">{e.herzfrequenz}</td>
                    <td className="px-4 py-2.5">{e.temperatur}°C</td>
                    <td className="px-4 py-2.5">{e.bewusstsein}</td>
                  </tr>
                ))}
                {!entries?.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-charcoal-lighter">Keine Einträge</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'messages' && (
          <div className="flex flex-col" style={{ height: 'calc(100vh - 220px)' }}>
            <div className="flex-1 overflow-y-auto space-y-3 pb-3">
              {(messages ?? []).map(m => (
                <div key={m.id} className={`flex ${m.vonAngehoerigen ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.vonAngehoerigen ? 'bg-teal-500 text-white rounded-br-none' : 'bg-white shadow-sm text-charcoal rounded-bl-none'}`}>
                    {!m.vonAngehoerigen && <p className="text-xs text-teal-600 font-medium mb-0.5">{m.absender ?? 'Pflegeteam'}</p>}
                    <p>{m.inhalt}</p>
                    <p className={`text-xs mt-1 ${m.vonAngehoerigen ? 'text-teal-100' : 'text-charcoal-lighter'}`}>
                      {new Date(m.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              {!messages?.length && <p className="text-center text-charcoal-lighter text-sm py-8">Noch keine Nachrichten</p>}
            </div>
            <div className="bg-white border-t pt-3 flex gap-2">
              <input
                value={msg}
                onChange={e => setMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                placeholder="Nachricht schreiben…"
                className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <button onClick={sendMessage} disabled={sending || !msg.trim()}
                className="bg-teal-500 text-white rounded-full p-2 hover:bg-teal-600 transition-colors disabled:opacity-50">
                <Send size={16}/>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
