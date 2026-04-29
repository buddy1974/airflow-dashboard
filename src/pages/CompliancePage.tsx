import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, AlertTriangle, XCircle, Pencil } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import AiWriteButton from '../components/AiWriteButton'
import StatusBanner from '../components/StatusBanner'
import api from '../lib/api'

interface ComplianceCheck { id: string; bezeichnung: string; beschreibung?: string; status: string; faelligAm?: string; erledigtAm?: string; mdkRelevant: boolean; kategorie?: string; bemerkungen?: string }
interface EditForm { bezeichnung: string; status: string; faelligAm: string; kategorie: string; bemerkungen: string }

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; cls: string }> = {
  KONFORM:         { icon: <CheckCircle size={20} className="text-teal-500"/>,   label: 'Erledigt', cls: 'border-teal-200 bg-teal-50' },
  FAELLIG:         { icon: <AlertTriangle size={20} className="text-yellow-500"/>, label: 'Fällig', cls: 'border-yellow-200 bg-yellow-50' },
  UEBERFAELLIG:    { icon: <XCircle size={20} className="text-red-500"/>,        label: 'ÜBERFÄLLIG — sofort erledigen!', cls: 'border-red-200 bg-red-50' },
  NICHT_ANWENDBAR: { icon: <span className="text-lg">—</span>,                   label: 'Nicht anwendbar', cls: 'border-gray-200 bg-gray-50' },
}

export default function CompliancePage() {
  const [editItem,    setEditItem]    = useState<ComplianceCheck | null>(null)
  const [form,        setForm]        = useState<EditForm>({ bezeichnung: '', status: 'FAELLIG', faelligAm: '', kategorie: '', bemerkungen: '' })
  const [aiResult,    setAiResult]    = useState('')
  const [aiLoading,   setAiLoading]   = useState(false)
  const [savedBanner, setSavedBanner] = useState(false)
  const queryClient = useQueryClient()

  const { data: mdkChecks, isLoading } = useQuery({ queryKey: ['compliance-mdk'], queryFn: () => api.get<{ success: boolean; checks: ComplianceCheck[] }>('/compliance/mdk').then(r => r.data.checks) })
  const { data: allChecks }            = useQuery({ queryKey: ['compliance-all'], queryFn: () => api.get<{ success: boolean; checks: ComplianceCheck[] }>('/compliance').then(r => r.data.checks) })

  const updateMutation = useMutation({
    mutationFn: (p: EditForm) => api.put(`/compliance/${editItem!.id}`, { ...p, faelligAm: p.faelligAm ? new Date(p.faelligAm).toISOString() : null }).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['compliance-mdk'] }); queryClient.invalidateQueries({ queryKey: ['compliance-all'] }); setEditItem(null); setSavedBanner(true) },
  })
  const completeMutation = useMutation({
    mutationFn: (id: string) => api.put(`/compliance/${id}/complete`).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['compliance-mdk'] }); queryClient.invalidateQueries({ queryKey: ['compliance-all'] }); setSavedBanner(true) },
  })

  const total   = allChecks?.length ?? 0
  const konform = allChecks?.filter(c => c.status === 'KONFORM').length ?? 0
  const pct     = total > 0 ? Math.round((konform / total) * 100) : 0

  const openEdit = (c: ComplianceCheck) => { setEditItem(c); setForm({ bezeichnung: c.bezeichnung, status: c.status, faelligAm: c.faelligAm ? c.faelligAm.split('T')[0] : '', kategorie: c.kategorie ?? '', bemerkungen: c.bemerkungen ?? '' }) }
  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"

  const generateMdk = async () => {
    setAiLoading(true)
    try {
      const res = await api.post<{ success: boolean; data: { result?: string } }>('/ai/mdk-writer', { dokumentTyp: 'Qualitätsbericht', kontext: '' })
      setAiResult(res.data.data.result ?? 'KI-MDK-Writer noch nicht verfügbar.')
    } catch { setAiResult('KI-MDK-Writer noch nicht verfügbar.') } finally { setAiLoading(false) }
  }

  const daysUntil = (iso?: string): number | null => {
    if (!iso) return null
    return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 3600 * 24))
  }

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  return (
    <div className="space-y-6">
      <PageHeader title="MDK-Qualitätsnachweise" subtitle="Diese Checkliste zeigt Ihnen, was für die nächste MDK-Prüfung vorbereitet sein muss."/>

      {savedBanner && <StatusBanner type="success" message="✅ Gespeichert!" autoDismiss onDismiss={() => setSavedBanner(false)}/>}

      {/* Progress */}
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-semibold text-charcoal text-lg">MDK-Bereitschaft: {pct}%</h3>
          <span className={`text-sm font-bold ${pct >= 80 ? 'text-teal-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>{konform} von {total} Anforderungen erfüllt</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 mb-4">
          <div className={`h-4 rounded-full transition-all ${pct >= 80 ? 'bg-teal-500' : pct >= 60 ? 'bg-yellow-400' : 'bg-red-500'}`} style={{ width: `${pct}%` }}/>
        </div>
        <AiWriteButton label="✨ MDK-Qualitätsbericht automatisch erstellen lassen" onClick={generateMdk} loading={aiLoading} fullWidth/>
        {aiResult && (
          <div className="mt-4 bg-teal-50 border border-teal-200 rounded-xl p-4 text-sm text-charcoal leading-relaxed whitespace-pre-wrap">{aiResult}</div>
        )}
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {(mdkChecks ?? []).map(c => {
          const cfg   = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.NICHT_ANWENDBAR
          const days  = daysUntil(c.faelligAm)
          const overdue = days !== null && days < 0
          return (
            <div key={c.id} className={`bg-white rounded-2xl border-2 p-5 ${cfg.cls}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5 flex-shrink-0">{cfg.icon}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-charcoal">{c.bezeichnung}</p>
                    {c.beschreibung && <p className="text-xs text-charcoal-lighter mt-0.5">{c.beschreibung}</p>}
                    {c.erledigtAm && c.status === 'KONFORM' && (
                      <p className="text-xs text-teal-600 mt-1">✅ Erledigt am {new Date(c.erledigtAm).toLocaleDateString('de-DE')}</p>
                    )}
                    {c.faelligAm && c.status !== 'KONFORM' && (
                      <p className={`text-xs mt-1 font-medium ${overdue ? 'text-red-600' : days !== null && days <= 14 ? 'text-orange-600' : 'text-charcoal-lighter'}`}>
                        {overdue ? `🚨 ÜBERFÄLLIG seit ${new Date(c.faelligAm).toLocaleDateString('de-DE')}` : `Fällig am ${new Date(c.faelligAm).toLocaleDateString('de-DE')} — noch ${days} Tage`}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {c.status !== 'KONFORM' && (
                    <button onClick={() => completeMutation.mutate(c.id)} disabled={completeMutation.isPending}
                      className={`text-sm font-semibold px-3 py-2 rounded-xl transition-colors disabled:opacity-50 ${overdue ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-teal-500 hover:bg-teal-600 text-white'}`}>
                      {overdue ? '🚨 Jetzt erledigen' : '✅ Als erledigt markieren'}
                    </button>
                  )}
                  <button onClick={() => openEdit(c)} className="text-charcoal-lighter hover:text-teal-600 p-1"><Pencil size={14}/></button>
                </div>
              </div>
            </div>
          )
        })}
        {!mdkChecks?.length && <div className="bg-white rounded-2xl p-8 text-center text-charcoal-lighter">Keine MDK-relevanten Compliance-Checks vorhanden</div>}
      </div>

      {editItem && (
        <Modal title="Compliance-Check bearbeiten" onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div><label className="block text-xs font-medium text-charcoal mb-1">Bezeichnung</label><input value={form.bezeichnung} onChange={e => setForm(f => ({ ...f, bezeichnung: e.target.value }))} className={cls}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Status</label><select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className={cls}>{Object.keys(STATUS_CONFIG).map(v => <option key={v}>{v}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Fällig am</label><input type="date" value={form.faelligAm} onChange={e => setForm(f => ({ ...f, faelligAm: e.target.value }))} className={cls}/></div>
            </div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Kategorie</label><input value={form.kategorie} onChange={e => setForm(f => ({ ...f, kategorie: e.target.value }))} className={cls}/></div>
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
