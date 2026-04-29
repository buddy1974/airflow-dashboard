import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { RefreshCw, Camera } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import EmptyState from '../components/EmptyState'
import OcrUpload from '../components/OcrUpload'
import api from '../lib/api'

interface Patient { id: string; vorname: string; nachname: string; diagnoseHaupt: string; status: string }
interface Alert    { id: string; parameter: string; wert: string; alertLevel: string; acknowledgedAt: string | null; patient?: { vorname: string; nachname: string }; createdAt: string }
interface LatestEntry { alertLevel: string; recordedAt: string; spo2: number; herzfrequenz: number; temperatur: number }

function minutesSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
}

function borderColor(level?: string) {
  if (level === 'ROT')  return 'border-l-4 border-red-500'
  if (level === 'GELB') return 'border-l-4 border-yellow-400'
  return 'border-l-4 border-teal-400'
}

export default function MonitoringPage() {
  const [showOcr, setShowOcr] = useState(false)
  const queryClient = useQueryClient()

  const { data: patients, isLoading } = useQuery({
    queryKey: ['patients-aktiv'],
    queryFn:  () => api.get<{ success: boolean; patients: Patient[] }>('/patients?status=AKTIV').then(r => r.data.patients),
    refetchInterval: 60000,
  })
  const { data: alerts } = useQuery({
    queryKey: ['monitoring-alerts-open'],
    queryFn:  () => api.get<{ success: boolean; alerts: Alert[] }>('/monitoring/alerts/open').then(r => r.data.alerts),
    refetchInterval: 60000,
  })
  const latestEntries = useQuery({
    queryKey: ['monitoring-latest-entries', patients?.map(p => p.id)],
    queryFn:  async () => {
      if (!patients?.length) return {} as Record<string, LatestEntry | null>
      const results = await Promise.allSettled(
        patients.map(p => api.get<{ success: boolean; entry: LatestEntry | null }>(`/monitoring/entries/patient/${p.id}/latest`).then(r => ({ id: p.id, entry: r.data.entry })))
      )
      const map: Record<string, LatestEntry | null> = {}
      results.forEach(r => { if (r.status === 'fulfilled') map[r.value.id] = r.value.entry })
      return map
    },
    enabled: !!patients?.length,
    refetchInterval: 60000,
  })

  const ackMutation = useMutation({
    mutationFn: (id: string) => api.put(`/monitoring/alerts/${id}/acknowledge`).then(r => r.data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['monitoring-alerts-open'] }),
  })

  if (isLoading) return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="animate-spin h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full"/>
      <p className="text-charcoal-lighter text-sm">⏳ Daten werden geladen…</p>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Überwachung & Vitalwerte"
        subtitle="Hier sehen Sie den aktuellen Zustand aller Patienten. Die Ampelfarben zeigen sofort, ob alles in Ordnung ist."
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowOcr(s => !s)}
              className="flex items-center gap-2 border border-teal-300 text-teal-600 bg-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-teal-50">
              <Camera size={16}/> 📷 Papierprotokoll scannen
            </button>
          </div>
        }
      />

      {/* Legend */}
      <div className="flex gap-4 mb-5 p-4 bg-white rounded-xl shadow-sm text-sm flex-wrap">
        <span className="font-semibold text-charcoal-lighter text-xs uppercase tracking-wider">Ampelfarben:</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-teal-400 inline-block"/>🟢 Grün = Alle Werte normal</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"/>🟡 Gelb = Leichte Auffälligkeit — bitte prüfen</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"/>🔴 Rot = Kritischer Wert — sofort handeln!</span>
        <span className="ml-auto text-xs text-charcoal-lighter flex items-center gap-1"><RefreshCw size={12}/> Aktualisiert alle 60 Sek.</span>
      </div>

      {/* OCR panel */}
      {showOcr && (
        <div className="mb-6 bg-white rounded-2xl shadow-sm p-4 md:p-6">
          <h3 className="font-semibold text-charcoal mb-2">📷 Papierprotokoll einscannen</h3>
          <p className="text-sm text-charcoal-lighter mb-4">Haben Sie ein ausgefülltes Papierformular? Laden Sie ein Foto hoch — wir lesen die Werte automatisch ein.</p>
          <OcrUpload onScan={(data) => { console.log('OCR data:', data); setShowOcr(false) }} type="monitoring"/>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Patient cards */}
        <div className="xl:col-span-2 space-y-4">
          {!patients?.length ? (
            <EmptyState
              title="Keine aktiven Patienten"
              message="Legen Sie Ihre ersten Patienten an, um mit der Überwachung zu beginnen."
              actionLabel="➕ Patienten anlegen"
              icon={<span className="text-5xl">👥</span>}
            />
          ) : (patients ?? []).map(p => {
            const entry = latestEntries.data?.[p.id]
            const level = entry?.alertLevel ?? 'GRUEN'
            const mins  = entry ? minutesSince(entry.recordedAt) : null
            const stale = mins !== null && mins > 75

            return (
              <div key={p.id} className={`bg-white rounded-2xl shadow-sm p-5 ${borderColor(level)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-charcoal text-lg">{p.vorname} {p.nachname}</p>
                    <p className="text-sm text-charcoal-lighter">{p.diagnoseHaupt}</p>
                    {mins !== null && (
                      <p className={`text-xs mt-1 ${stale ? 'text-red-500 font-semibold' : 'text-charcoal-lighter'}`}>
                        {stale ? `⚠️ Kein Eintrag seit über ${mins} Minuten!` : `Letzter Eintrag: vor ${mins} Minuten`}
                      </p>
                    )}
                    {!entry && <p className="text-xs text-charcoal-lighter mt-1">Noch kein Eintrag heute</p>}
                  </div>
                  <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${
                    level === 'ROT'  ? 'bg-red-100 text-red-700' :
                    level === 'GELB' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-teal-100 text-teal-700'
                  }`}>
                    {level === 'ROT' ? '🔴 KRITISCH' : level === 'GELB' ? '🟡 WARNUNG' : '🟢 NORMAL'}
                  </span>
                </div>

                {entry && (
                  <div className="flex gap-3 mb-3 text-xs flex-wrap">
                    <span className="bg-gray-50 px-2 py-1 rounded-lg"><span className="font-semibold">SpO2:</span> {entry.spo2}%</span>
                    <span className="bg-gray-50 px-2 py-1 rounded-lg"><span className="font-semibold">Puls:</span> {entry.herzfrequenz}/min</span>
                    <span className="bg-gray-50 px-2 py-1 rounded-lg"><span className="font-semibold">Temp:</span> {entry.temperatur}°C</span>
                  </div>
                )}

                {stale && (
                  <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-700 mb-3">
                    ⚠️ Kein Eintrag seit über 75 Minuten! Bitte Messwerte eintragen.
                  </div>
                )}

                <div className="flex gap-2">
                  <Link to={`/monitoring/${p.id}`}
                    className="flex-1 text-center bg-gray-50 hover:bg-gray-100 text-charcoal font-medium px-3 py-2 rounded-xl text-sm transition-colors">
                    📊 Vitalwerte ansehen
                  </Link>
                  <Link to={`/monitoring/${p.id}`}
                    className="flex-1 text-center bg-teal-500 hover:bg-teal-600 text-white font-semibold px-3 py-2 rounded-xl text-sm transition-colors">
                    ➕ Neue Werte eintragen
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Alerts panel */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-red-50 border-b border-red-100">
            <h3 className="font-semibold text-red-700">🚨 Offene Meldungen ({alerts?.length ?? 0})</h3>
            <p className="text-xs text-red-500 mt-0.5">Bitte prüfen und bestätigen</p>
          </div>
          {!alerts?.length ? (
            <div className="p-6 text-center">
              <p className="text-teal-600 font-medium">✅ Alles in Ordnung</p>
              <p className="text-xs text-charcoal-lighter mt-1">Keine offenen Meldungen</p>
            </div>
          ) : (
            <div className="divide-y max-h-[500px] overflow-y-auto">
              {alerts.map(a => (
                <div key={a.id} className="px-4 py-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-sm font-semibold text-charcoal">{a.parameter}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${a.alertLevel === 'ROT' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {a.alertLevel}
                    </span>
                  </div>
                  <p className="text-xs text-charcoal-lighter">{a.patient ? `${a.patient.vorname} ${a.patient.nachname}` : '—'} · Wert: {a.wert}</p>
                  <button
                    onClick={() => ackMutation.mutate(a.id)}
                    disabled={ackMutation.isPending}
                    className="mt-2 w-full text-xs bg-teal-500 hover:bg-teal-600 text-white font-medium py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    ✅ Meldung bestätigen
                  </button>
                </div>
              ))}
            </div>
          )}
          {alerts && alerts.length > 0 && (
            <div className="px-4 py-3 bg-gray-50 text-xs text-charcoal-lighter border-t">
              Diese Meldungen wurden automatisch ausgelöst, weil ein Messwert außerhalb des Normalbereichs lag. Bitte prüfen Sie den Patienten und bestätigen Sie die Meldung.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
