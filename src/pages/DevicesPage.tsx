import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Pencil, Wrench } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import StatusBanner from '../components/StatusBanner'
import api from '../lib/api'

interface Device { id: string; bezeichnung: string; typ: string; status: string; naechsteWartung?: string; hersteller?: string; modell?: string; bemerkungen?: string; patient?: { vorname: string; nachname: string }; location?: { name: string } }
interface EditForm { bezeichnung: string; typ: string; status: string; hersteller: string; modell: string; bemerkungen: string; naechsteWartung: string }
interface CheckItem { deviceId: string; label: string; ok: boolean }

const DEVICE_TYPES   = ['BEATMUNG','ABSAUGUNG','SAUERSTOFF','MONITORING','ERNAEHRUNG','SONSTIGES']
const DEVICE_STATUS  = ['AKTIV','WARTUNG','DEFEKT','EINGELAGERT']
const STATUS_UI: Record<string, { label: string; cls: string }> = {
  AKTIV:       { label: '✅ In Betrieb',                         cls: 'bg-teal-100 text-teal-700' },
  WARTUNG:     { label: '🔧 In Wartung',                        cls: 'bg-yellow-100 text-yellow-700' },
  DEFEKT:      { label: '🚨 Defekt — sofort melden!',           cls: 'bg-red-100 text-red-700' },
  EINGELAGERT: { label: '📦 Eingelagert',                       cls: 'bg-gray-100 text-gray-600' },
}

function daysUntil(iso?: string): number | null {
  if (!iso) return null
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 3600 * 24))
}

export default function DevicesPage() {
  const [editItem,    setEditItem]    = useState<Device | null>(null)
  const [form,        setForm]        = useState<EditForm>({ bezeichnung: '', typ: 'BEATMUNG', status: 'AKTIV', hersteller: '', modell: '', bemerkungen: '', naechsteWartung: '' })
  const [showCheck,   setShowCheck]   = useState(false)
  const [checks,      setChecks]      = useState<CheckItem[]>([])
  const [savedBanner, setSavedBanner] = useState(false)
  const queryClient = useQueryClient()

  const { data: devices, isLoading } = useQuery({ queryKey: ['devices'], queryFn: () => api.get<{ success: boolean; devices: Device[] }>('/devices').then(r => r.data.devices) })
  const { data: maintenance }        = useQuery({ queryKey: ['devices-maintenance'], queryFn: () => api.get<{ success: boolean; devices: Device[] }>('/devices/maintenance-due').then(r => r.data.devices) })

  const updateMutation = useMutation({
    mutationFn: (p: EditForm) => api.put(`/devices/${editItem!.id}`, { ...p, naechsteWartung: p.naechsteWartung ? new Date(p.naechsteWartung).toISOString() : null }).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['devices'] }); setEditItem(null); setSavedBanner(true) },
  })
  const checkMutation = useMutation({
    mutationFn: ({ id, ok }: { id: string; ok: boolean }) => api.post(`/devices/${id}/check`, { funktionsfaehig: ok }).then(r => r.data),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: ['devices'] }),
  })

  const openEdit = (d: Device) => { setEditItem(d); setForm({ bezeichnung: d.bezeichnung, typ: d.typ, status: d.status, hersteller: d.hersteller ?? '', modell: d.modell ?? '', bemerkungen: d.bemerkungen ?? '', naechsteWartung: d.naechsteWartung ? d.naechsteWartung.split('T')[0] : '' }) }

  const openDailyCheck = () => {
    setChecks((devices ?? []).filter(d => d.status === 'AKTIV' || d.status === 'WARTUNG').map(d => ({ deviceId: d.id, label: d.bezeichnung, ok: true })))
    setShowCheck(true)
  }

  const submitChecks = async () => {
    await Promise.all(checks.map(c => checkMutation.mutateAsync({ id: c.deviceId, ok: c.ok })))
    setShowCheck(false); setSavedBanner(true)
  }

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"

  return (
    <div className="space-y-6">
      <PageHeader
        title="Beatmungsgeräte & medizinische Geräte"
        subtitle="Hier sehen Sie alle Geräte, ihren aktuellen Zustand und wann die nächste Wartung fällig ist."
        action={
          <button onClick={openDailyCheck} className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-600">
            ✅ Täglichen Gerätecheck durchführen
          </button>
        }
      />

      {savedBanner && <StatusBanner type="success" message="✅ Gerätecheck gespeichert!" autoDismiss onDismiss={() => setSavedBanner(false)}/>}

      {maintenance && maintenance.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-3 flex items-center gap-3 text-sm text-orange-800">
          <Wrench size={18} className="flex-shrink-0 text-orange-500"/>
          <span>🔧 Wartung fällig: {maintenance.map(d => `${d.bezeichnung} (in ${daysUntil(d.naechsteWartung) ?? '?'} Tagen)`).join(', ')}. Bitte Wartungstermin vereinbaren.</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(devices ?? []).map(d => {
          const ui   = STATUS_UI[d.status] ?? STATUS_UI.EINGELAGERT
          const days = daysUntil(d.naechsteWartung)
          return (
            <div key={d.id} className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-charcoal">{d.bezeichnung}</p>
                  <p className="text-xs text-charcoal-lighter">{d.hersteller ?? ''}{d.modell ? ` · ${d.modell}` : ''}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ui.cls}`}>{ui.label}</span>
              </div>
              {d.patient && <p className="text-xs text-teal-600">👤 Zugewiesen an: <span className="font-semibold">{d.patient.vorname} {d.patient.nachname}</span></p>}
              {d.naechsteWartung && (
                <p className={`text-xs font-medium ${days !== null && days <= 14 ? 'text-orange-600' : 'text-charcoal-lighter'}`}>
                  {days !== null && days <= 14 ? `⚠️ Nächste Wartung: ${new Date(d.naechsteWartung).toLocaleDateString('de-DE')} (in ${days} Tagen)` : `🔧 Nächste Wartung: ${new Date(d.naechsteWartung).toLocaleDateString('de-DE')}`}
                </p>
              )}
              <div className="flex gap-1.5">
                <button onClick={async () => { await checkMutation.mutateAsync({ id: d.id, ok: true }); setSavedBanner(true) }}
                  className="flex-1 text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium py-2 rounded-lg">✅ Check OK</button>
                <button onClick={() => openEdit(d)} className="px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg"><Pencil size={13} className="text-charcoal-lighter"/></button>
                {d.status !== 'DEFEKT' && (
                  <button onClick={async () => { await api.put(`/devices/${d.id}`, { status: 'DEFEKT' }); queryClient.invalidateQueries({ queryKey: ['devices'] }) }}
                    className="px-3 py-2 bg-red-50 hover:bg-red-100 rounded-lg text-xs text-red-600 font-medium">🚨 Defekt</button>
                )}
              </div>
            </div>
          )
        })}
        {!devices?.length && <div className="col-span-3 bg-white rounded-2xl p-8 text-center text-charcoal-lighter">Noch keine Geräte angelegt</div>}
      </div>

      {/* Daily check modal */}
      {showCheck && (
        <Modal title="✅ Täglichen Gerätecheck durchführen" onClose={() => setShowCheck(false)}>
          <div className="space-y-3">
            <p className="text-sm text-charcoal-lighter">Bestätigen Sie, dass Sie alle Geräte heute überprüft haben. Markieren Sie Geräte mit Problemen als "Defekt".</p>
            {checks.map((c, i) => (
              <div key={c.deviceId} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-charcoal">{c.label}</span>
                <div className="flex gap-2">
                  <button onClick={() => setChecks(cs => cs.map((x, j) => j === i ? { ...x, ok: true } : x))} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${c.ok ? 'bg-teal-500 text-white' : 'bg-gray-200 text-charcoal-lighter'}`}>✅ OK</button>
                  <button onClick={() => setChecks(cs => cs.map((x, j) => j === i ? { ...x, ok: false } : x))} className={`text-xs px-3 py-1.5 rounded-lg font-medium ${!c.ok ? 'bg-red-500 text-white' : 'bg-gray-200 text-charcoal-lighter'}`}>🚨 Problem</button>
                </div>
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowCheck(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Abbrechen</button>
              <button onClick={submitChecks} className="px-5 py-2 rounded-xl bg-teal-500 text-white text-sm font-semibold hover:bg-teal-600">✅ Check abschließen</button>
            </div>
          </div>
        </Modal>
      )}

      {editItem && (
        <Modal title={`Gerät bearbeiten — ${editItem.bezeichnung}`} onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div><label className="block text-xs font-medium text-charcoal mb-1">Bezeichnung</label><input value={form.bezeichnung} onChange={e => setForm(f => ({ ...f, bezeichnung: e.target.value }))} className={cls}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Gerätetyp</label><select value={form.typ} onChange={e => setForm(f => ({ ...f, typ: e.target.value }))} className={cls}>{DEVICE_TYPES.map(v => <option key={v}>{v}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={cls}>{DEVICE_STATUS.map(v => <option key={v}>{STATUS_UI[v]?.label?.replace(/[✅🔧🚨📦]\s*/,'') ?? v}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Hersteller</label><input value={form.hersteller} onChange={e => setForm(f => ({ ...f, hersteller: e.target.value }))} className={cls}/></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Modell</label><input value={form.modell} onChange={e => setForm(f => ({ ...f, modell: e.target.value }))} className={cls}/></div>
            </div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Nächste Wartung</label><input type="date" value={form.naechsteWartung} onChange={e => setForm(f => ({ ...f, naechsteWartung: e.target.value }))} className={cls}/></div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Bemerkungen</label><textarea value={form.bemerkungen} onChange={e => setForm(f => ({ ...f, bemerkungen: e.target.value }))} rows={2} className={`${cls} resize-none`}/></div>
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
