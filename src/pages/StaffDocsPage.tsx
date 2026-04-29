import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Pencil, CheckCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Modal from '../components/Modal'
import UploadZone from '../components/UploadZone'
import StatusBanner from '../components/StatusBanner'
import api from '../lib/api'

interface StaffDoc { id: string; typ: string; bezeichnung: string; verifiziert: boolean; ausstellungsdatum?: string; ablaufdatum?: string; dokumentUrl?: string; bemerkungen?: string; user?: { name: string } }
interface EditForm  { bezeichnung: string; typ: string; ablaufdatum: string; dokumentUrl: string; bemerkungen: string }

const DOC_TYPE_LABELS: Record<string, string> = {
  FUEHRUNGSZEUGNIS:   'Erweitertes Führungszeugnis',
  AUSBILDUNGSNACHWEIS:'Ausbildungs- oder Berufsabschluss',
  IMPFNACHWEIS:       'Impfnachweis',
  ARBEITSVERTRAG:     'Arbeitsvertrag',
  QUALIFIKATION:      'Qualifikationszertifikat',
  SONSTIGES:          'Sonstiges Dokument',
}

function expiryStatus(iso?: string): { cls: string; label: string } {
  if (!iso) return { cls: 'text-charcoal-lighter', label: '—' }
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 3600 * 24))
  if (days < 0)  return { cls: 'text-red-600 font-bold', label: `🚨 Abgelaufen! (${new Date(iso).toLocaleDateString('de-DE')})` }
  if (days <= 30) return { cls: 'text-orange-600 font-semibold', label: `⚠️ Läuft ab in ${days} Tagen (${new Date(iso).toLocaleDateString('de-DE')})` }
  return { cls: 'text-charcoal-lighter', label: `✅ ${new Date(iso).toLocaleDateString('de-DE')}` }
}

export default function StaffDocsPage() {
  const [editItem,     setEditItem]     = useState<StaffDoc | null>(null)
  const [showUpload,   setShowUpload]   = useState(false)
  const [form,         setForm]         = useState<EditForm>({ bezeichnung: '', typ: 'SONSTIGES', ablaufdatum: '', dokumentUrl: '', bemerkungen: '' })
  const [newTyp,       setNewTyp]       = useState('SONSTIGES')
  const [newBez,       setNewBez]       = useState('')
  const [newAblauf,    setNewAblauf]    = useState('')
  const [newUserId,    setNewUserId]    = useState('')
  const [savedBanner,  setSavedBanner]  = useState(false)
  const queryClient = useQueryClient()

  const { data: docs,     isLoading } = useQuery({ queryKey: ['staff-documents'],          queryFn: () => api.get<{ success: boolean; documents: StaffDoc[] }>('/staff-documents').then(r => r.data.documents) })
  const { data: expiring }            = useQuery({ queryKey: ['staff-documents-expiring'], queryFn: () => api.get<{ success: boolean; documents: StaffDoc[] }>('/staff-documents/expiring').then(r => r.data.documents) })
  const { data: users }               = useQuery({ queryKey: ['users'],                    queryFn: () => api.get<{ success: boolean; users: { id: string; name: string }[] }>('/users').then(r => r.data.users) })

  const updateMutation = useMutation({
    mutationFn: (p: EditForm) => api.put(`/staff-documents/${editItem!.id}`, { ...p, ablaufdatum: p.ablaufdatum ? new Date(p.ablaufdatum).toISOString() : null }).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['staff-documents'] }); setEditItem(null); setSavedBanner(true) },
  })
  const verifyMutation = useMutation({
    mutationFn: (id: string) => api.put(`/staff-documents/${id}/verify`).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['staff-documents'] }); setSavedBanner(true) },
  })
  const createMutation = useMutation({
    mutationFn: (p: { userId: string; typ: string; bezeichnung: string; ablaufdatum?: string }) => api.post('/staff-documents', p).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['staff-documents'] }); setShowUpload(false); setSavedBanner(true) },
  })

  const openEdit = (d: StaffDoc) => { setEditItem(d); setForm({ bezeichnung: d.bezeichnung, typ: d.typ, ablaufdatum: d.ablaufdatum ? d.ablaufdatum.split('T')[0] : '', dokumentUrl: d.dokumentUrl ?? '', bemerkungen: d.bemerkungen ?? '' }) }
  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mitarbeiterdokumente"
        subtitle="Alle Zertifikate, Nachweise und Dokumente Ihrer Mitarbeiter. Das System warnt Sie automatisch, wenn etwas abläuft."
        action={<button onClick={() => setShowUpload(true)} className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-600">📎 Neues Dokument hochladen</button>}
      />

      {savedBanner && <StatusBanner type="success" message="✅ Gespeichert!" autoDismiss onDismiss={() => setSavedBanner(false)}/>}

      {expiring && expiring.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4 flex items-center gap-3">
          <AlertTriangle size={20} className="text-orange-500 flex-shrink-0"/>
          <div>
            <p className="font-semibold text-orange-800">⚠️ Achtung: {expiring.length} Dokumente laufen in den nächsten 30 Tagen ab</p>
            <div className="text-xs text-orange-700 mt-1 space-y-0.5">
              {expiring.slice(0, 3).map(d => <p key={d.id}>• {d.user?.name ?? '—'} — {DOC_TYPE_LABELS[d.typ] ?? d.typ} — {d.ablaufdatum ? new Date(d.ablaufdatum).toLocaleDateString('de-DE') : '—'}</p>)}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Mitarbeiter</th>
              <th className="px-4 py-3 text-left">Dokumenttyp</th>
              <th className="px-4 py-3 text-left">Bezeichnung</th>
              <th className="px-4 py-3 text-left">Ablaufdatum</th>
              <th className="px-4 py-3 text-left">Verifiziert</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(docs ?? []).map(d => {
              const expiry = expiryStatus(d.ablaufdatum)
              return (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-charcoal">{d.user?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-sm">{DOC_TYPE_LABELS[d.typ] ?? d.typ}</td>
                  <td className="px-4 py-3 text-charcoal-lighter">{d.bezeichnung}</td>
                  <td className={`px-4 py-3 ${expiry.cls}`}>{expiry.label}</td>
                  <td className="px-4 py-3">
                    {d.verifiziert
                      ? <span className="flex items-center gap-1 text-xs text-teal-600"><CheckCircle size={14}/> Verifiziert</span>
                      : <button onClick={() => verifyMutation.mutate(d.id)} className="text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 px-2.5 py-1 rounded-lg font-medium">✅ Verifizieren</button>}
                  </td>
                  <td className="px-4 py-3"><button onClick={() => openEdit(d)} className="text-charcoal-lighter hover:text-teal-600"><Pencil size={14}/></button></td>
                </tr>
              )
            })}
            {!docs?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal-lighter">Noch keine Dokumente hochgeladen</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <Modal title="📎 Neues Dokument hochladen" onClose={() => setShowUpload(false)}>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Mitarbeiter</label>
              <select value={newUserId} onChange={e => setNewUserId(e.target.value)} className={cls}>
                <option value="">— Mitarbeiter auswählen —</option>
                {(users ?? []).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-charcoal mb-1">Dokumenttyp</label>
              <select value={newTyp} onChange={e => setNewTyp(e.target.value)} className={cls}>
                {Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Bezeichnung</label><input value={newBez} onChange={e => setNewBez(e.target.value)} placeholder="z.B. Führungszeugnis 2026" className={cls}/></div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Ablaufdatum (falls vorhanden)</label><input type="date" value={newAblauf} onChange={e => setNewAblauf(e.target.value)} className={cls}/></div>
            <UploadZone label="Dokument hochladen" hint="Ziehen Sie die Datei hier hin oder klicken Sie" onFile={(f) => console.log('Doc file:', f.name)}/>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowUpload(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Abbrechen</button>
              <button
                onClick={() => createMutation.mutate({ userId: newUserId, typ: newTyp, bezeichnung: newBez, ablaufdatum: newAblauf ? new Date(newAblauf).toISOString() : undefined })}
                disabled={!newUserId || !newBez || createMutation.isPending}
                className="px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 disabled:opacity-50">
                📎 {createMutation.isPending ? 'Speichere…' : 'Dokument speichern'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {editItem && (
        <Modal title="Dokument bearbeiten" onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div><label className="block text-xs font-medium text-charcoal mb-1">Bezeichnung</label><input value={form.bezeichnung} onChange={e => setForm(f => ({ ...f, bezeichnung: e.target.value }))} className={cls}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Dokumenttyp</label><select value={form.typ} onChange={e => setForm(f => ({ ...f, typ: e.target.value }))} className={cls}>{Object.entries(DOC_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Ablaufdatum</label><input type="date" value={form.ablaufdatum} onChange={e => setForm(f => ({ ...f, ablaufdatum: e.target.value }))} className={cls}/></div>
            </div>
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
