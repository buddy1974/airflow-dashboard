import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Send, Mail, Calendar } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import api from '../lib/api'

interface GmailMessage { id: string; from: string; subject: string; receivedAt: string; snippet?: string }
interface CalEvent     { id?: string; summary?: string; start?: { dateTime?: string; date?: string } }

export default function PdlOfficePage() {
  const [command, setCommand] = useState('')
  const [chatLog, setChatLog] = useState<{ role: 'user' | 'donna'; text: string }[]>([])
  const [sending, setSending] = useState(false)

  const { data: messages } = useQuery({
    queryKey: ['gmail-messages'],
    queryFn:  () => api.get<{ success: boolean; messages: GmailMessage[] }>('/gmail/messages').then(r => r.data.messages).catch(() => [] as GmailMessage[]),
  })

  const { data: todayEvents } = useQuery({
    queryKey: ['calendar-today'],
    queryFn:  () => api.get<{ success: boolean; events: CalEvent[] }>('/calendar/today').then(r => r.data.events).catch(() => [] as CalEvent[]),
  })

  const { data: upcomingEvents } = useQuery({
    queryKey: ['calendar-upcoming'],
    queryFn:  () => api.get<{ success: boolean; events: CalEvent[] }>('/calendar/upcoming').then(r => r.data.events).catch(() => [] as CalEvent[]),
  })

  const sendCommand = async () => {
    if (!command.trim()) return
    const text = command.trim()
    setChatLog(l => [...l, { role: 'user', text }])
    setCommand('')
    setSending(true)
    try {
      const { data } = await api.post<{ success: boolean; data: { response: string } }>('/pdl/command', { command: text })
      setChatLog(l => [...l, { role: 'donna', text: data.data.response }])
    } catch {
      setChatLog(l => [...l, { role: 'donna', text: 'Entschuldigung, ich konnte keine Verbindung herstellen.' }])
    } finally {
      setSending(false)
    }
  }

  const formatTime = (iso?: string) => {
    if (!iso) return ''
    return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div>
      <PageHeader title="PDL Büro" subtitle="Gmail · Kalender · Donna AI" />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Gmail */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-teal-50">
            <Mail size={16} className="text-teal-600" />
            <h3 className="font-semibold text-sm text-charcoal">Posteingang</h3>
          </div>
          <div className="divide-y max-h-[480px] overflow-y-auto">
            {!messages || messages.length === 0 ? (
              <div className="p-6 text-center text-sm text-charcoal-lighter">
                Gmail nicht verbunden.{' '}
                <a href="/api/gmail/auth" className="text-teal-500 underline">Verbinden</a>
              </div>
            ) : messages.map(m => (
              <div key={m.id} className="px-4 py-3 hover:bg-gray-50">
                <p className="text-xs text-charcoal-lighter truncate">{m.from}</p>
                <p className="text-sm font-medium text-charcoal truncate">{m.subject}</p>
                {m.snippet && <p className="text-xs text-charcoal-lighter truncate mt-0.5">{m.snippet}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-teal-50">
            <Calendar size={16} className="text-teal-600" />
            <h3 className="font-semibold text-sm text-charcoal">Kalender</h3>
          </div>
          <div className="p-4 space-y-3 max-h-[480px] overflow-y-auto">
            <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider">Heute</p>
            {!todayEvents || todayEvents.length === 0 ? (
              <p className="text-sm text-charcoal-lighter">Keine Termine heute</p>
            ) : todayEvents.map((e, i) => (
              <div key={e.id ?? i} className="flex gap-3">
                <div className="text-xs text-teal-600 font-medium w-12 pt-0.5 flex-shrink-0">
                  {formatTime(e.start?.dateTime)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal truncate">{e.summary ?? 'Termin'}</p>
                </div>
              </div>
            ))}
            <p className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider pt-2">Nächste 7 Tage</p>
            {!upcomingEvents || upcomingEvents.length === 0 ? (
              <p className="text-sm text-charcoal-lighter">Keine weiteren Termine</p>
            ) : upcomingEvents.slice(0, 5).map((e, i) => (
              <div key={e.id ?? i} className="flex gap-3">
                <div className="text-xs text-charcoal-lighter w-12 pt-0.5 flex-shrink-0">
                  {e.start?.dateTime ? new Date(e.start.dateTime).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }) : '—'}
                </div>
                <p className="text-sm text-charcoal truncate">{e.summary ?? 'Termin'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Donna AI */}
        <div className="bg-white rounded-xl shadow-sm flex flex-col overflow-hidden" style={{ maxHeight: '540px' }}>
          <div className="px-4 py-3 border-b bg-teal-50 flex-shrink-0">
            <h3 className="font-semibold text-sm text-charcoal">Donna · KI-Assistentin</h3>
            <p className="text-xs text-charcoal-lighter">Ihre persönliche ICU-Assistentin</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatLog.length === 0 && (
              <div className="text-center text-sm text-charcoal-lighter py-8">
                <p className="font-medium">Hallo! Ich bin Donna.</p>
                <p className="mt-1">Wie kann ich Ihnen heute helfen?</p>
              </div>
            )}
            {chatLog.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'bg-teal-500 text-white rounded-br-none'
                    : 'bg-gray-100 text-charcoal rounded-bl-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-3 py-2 text-sm text-charcoal-lighter rounded-bl-none">
                  Donna denkt…
                </div>
              </div>
            )}
          </div>
          <div className="border-t p-3 flex gap-2 flex-shrink-0">
            <input
              value={command}
              onChange={e => setCommand(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendCommand()}
              placeholder="Frage an Donna…"
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
            />
            <button
              onClick={sendCommand}
              disabled={sending}
              className="bg-teal-500 text-white rounded-full p-2 hover:bg-teal-600 transition-colors disabled:opacity-50"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
