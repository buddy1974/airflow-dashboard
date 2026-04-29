import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Activity, Users } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import Modal from '../components/Modal'
import EmptyState from '../components/EmptyState'
import HelpTooltip from '../components/HelpTooltip'
import StatusBanner from '../components/StatusBanner'
import api from '../lib/api'

interface Patient { id: string; vorname: string; nachname: string; geburtsdatum?: string; diagnoseHaupt: string; pflegegrad: string; beatmungspflichtig: boolean; status: string; bemerkungen?: string; location?: { name: string } }
interface EditForm { vorname: string; nachname: string; diagnoseHaupt: string; pflegegrad: string; status: string; bemerkungen: string }
interface CreateForm extends EditForm { geburtsdatum: string; adresse: string; kostentraeger: string; notfallkontaktName: string; notfallkontaktTel: string; beatmungspflichtig: boolean; tracheostoma: boolean }

const EMPTY_CREATE: CreateForm = { vorname: '', nachname: '', diagnoseHaupt: '', geburtsdatum: '', pflegegrad: 'PG3', status: 'AKTIV', bemerkungen: '', adresse: '', kostentraeger: '', notfallkontaktName: '', notfallkontaktTel: '', beatmungspflichtig: false, tracheostoma: false }

function calcAge(iso?: string): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const age = Math.floor(diff / (365.25 * 24 * 3600 * 1000))
  return `${age} Jahre`
}

export default function PatientsPage() {
  const [editItem,    setEditItem]    = useState<Patient | null>(null)
  const [showCreate,  setShowCreate]  = useState(false)
  const [editForm,    setEditForm]    = useState<EditForm>({ vorname: '', nachname: '', diagnoseHaupt: '', pflegegrad: 'PG3', status: 'AKTIV', bemerkungen: '' })
  const [createForm,  setCreateForm]  = useState<CreateForm>(EMPTY_CREATE)
  const [savedBanner, setSavedBanner] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, error } = useQuery({ queryKey: ['patients'], queryFn: () => api.get<{ success: boolean; patients: Patient[] }>('/patients').then(r => r.data.patients) })

  const updateMutation = useMutation({
    mutationFn: (p: EditForm) => api.put(`/patients/${editItem!.id}`, p).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); setEditItem(null); setSavedBanner(true) },
  })
  const createMutation = useMutation({
    mutationFn: (p: CreateForm) => api.post('/patients', { ...p, geburtsdatum: p.geburtsdatum ? new Date(p.geburtsdatum).toISOString() : undefined }).then(r => r.data),
    onSuccess:  () => { queryClient.invalidateQueries({ queryKey: ['patients'] }); setShowCreate(false); setCreateForm(EMPTY_CREATE); setSavedBanner(true) },
  })

  const openEdit = (p: Patient) => { setEditItem(p); setEditForm({ vorname: p.vorname, nachname: p.nachname, diagnoseHaupt: p.diagnoseHaupt, pflegegrad: p.pflegegrad, status: p.status, bemerkungen: p.bemerkungen ?? '' }) }
  const cls = "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
  const F  = (k: string, form: Record<string, string | boolean>, setForm: (fn: (f: typeof form) => typeof form) => void) => ({ value: form[k] as string, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm((f: typeof form) => ({ ...f, [k]: e.target.value })) })

  if (isLoading) return <div className="flex flex-col items-center justify-center py-16 gap-3"><div className="animate-spin h-12 w-12 border-4 border-teal-500 border-t-transparent rounded-full"/><p className="text-charcoal-lighter">⏳ Patientenliste wird geladen…</p></div>
  if (error) return <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center"><p className="text-red-700 font-medium">❌ Fehler beim Laden der Patienten</p><button onClick={() => queryClient.invalidateQueries({ queryKey: ['patients'] })} className="mt-3 text-sm text-teal-600 underline">🔄 Erneut versuchen</button></div>

  return (
    <div>
      <PageHeader
        title="Patienten"
        subtitle="Alle betreuten Patienten im Überblick."
        action={
          <div className="flex gap-2">
            <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-600">➕ Neuen Patienten anlegen</button>
            <Link to="/import" className="flex items-center gap-2 border border-gray-200 text-charcoal px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50">📥 Aus Excel importieren</Link>
          </div>
        }
      />

      {savedBanner && <StatusBanner type="success" message="✅ Gespeichert! Die Patientendaten wurden erfolgreich übernommen." autoDismiss onDismiss={() => setSavedBanner(false)}/>}

      {!data?.length ? (
        <EmptyState
          title="Noch keine Patienten angelegt"
          message="Legen Sie Ihren ersten Patienten manuell an oder importieren Sie Ihre bestehende Patientenliste aus Excel."
          actionLabel="➕ Manuell anlegen"
          onAction={() => setShowCreate(true)}
          secondaryLabel="📥 Excel importieren"
          onSecondary={() => window.location.href = '/import'}
          icon={<Users size={40}/>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm p-5 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-charcoal text-lg">{p.vorname} {p.nachname}</h3>
                  {p.geburtsdatum && <p className="text-xs text-charcoal-lighter">{new Date(p.geburtsdatum).toLocaleDateString('de-DE')} · {calcAge(p.geburtsdatum)}</p>}
                </div>
                <Badge status={p.status}/>
              </div>
              <p className="text-sm text-charcoal-lighter mb-3 line-clamp-2">{p.diagnoseHaupt}</p>
              <div className="flex gap-2 mb-4 flex-wrap">
                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">Pflegegrad {p.pflegegrad.replace('PG','')}</span>
                {p.beatmungspflichtig && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">🫁 Beatmungspflichtig</span>}
                {p.location && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{p.location.name}</span>}
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <Link to={`/monitoring/${p.id}`} className="flex items-center justify-center gap-1 text-xs bg-teal-50 hover:bg-teal-100 text-teal-700 font-medium px-2 py-2 rounded-lg transition-colors">
                  <Activity size={12}/> Monitoring
                </Link>
                <button onClick={() => openEdit(p)} className="text-xs bg-gray-50 hover:bg-gray-100 text-charcoal font-medium px-2 py-2 rounded-lg transition-colors">
                  ✏️ Bearbeiten
                </button>
                <Link to="/care-plans" className="flex items-center justify-center text-xs bg-gray-50 hover:bg-gray-100 text-charcoal font-medium px-2 py-2 rounded-lg transition-colors">
                  📋 Pflegeplan
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editItem && (
        <Modal title={`Patient bearbeiten — ${editItem.vorname} ${editItem.nachname}`} onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Vorname</label><input {...F('vorname', editForm as unknown as Record<string, string | boolean>, setEditForm as never)} className={cls}/></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Nachname</label><input {...F('nachname', editForm as unknown as Record<string, string | boolean>, setEditForm as never)} className={cls}/></div>
            </div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Hauptdiagnose</label><input value={editForm.diagnoseHaupt} onChange={e => setEditForm(f => ({ ...f, diagnoseHaupt: e.target.value }))} className={cls}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Pflegegrad <HelpTooltip text="Pflegegrad 5 = höchster Pflegebedarf"/></label><select value={editForm.pflegegrad} onChange={e => setEditForm(f => ({ ...f, pflegegrad: e.target.value }))} className={cls}>{['PG1','PG2','PG3','PG4','PG5'].map(v => <option key={v} value={v}>Pflegegrad {v.replace('PG','')}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Status</label><select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className={cls}>{['AKTIV','PAUSIERT','ENTLASSEN'].map(v => <option key={v}>{v}</option>)}</select></div>
            </div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Bemerkungen</label><textarea value={editForm.bemerkungen} onChange={e => setEditForm(f => ({ ...f, bemerkungen: e.target.value }))} rows={2} className={`${cls} resize-none`}/></div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setEditItem(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Abbrechen</button>
              <button onClick={() => updateMutation.mutate(editForm)} disabled={updateMutation.isPending} className="px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 disabled:opacity-50">💾 {updateMutation.isPending ? 'Speichere…' : 'Änderungen speichern'}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal title="Neuen Patienten anlegen" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Vorname *</label><input value={createForm.vorname} onChange={e => setCreateForm(f => ({ ...f, vorname: e.target.value }))} placeholder="Vorname" className={cls}/></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Nachname *</label><input value={createForm.nachname} onChange={e => setCreateForm(f => ({ ...f, nachname: e.target.value }))} placeholder="Nachname" className={cls}/></div>
            </div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Geburtsdatum *</label><input type="date" value={createForm.geburtsdatum} onChange={e => setCreateForm(f => ({ ...f, geburtsdatum: e.target.value }))} className={cls}/></div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Hauptdiagnose * <HelpTooltip text="z.B. COPD Grad IV, ALS, Schlaganfall"/></label><input value={createForm.diagnoseHaupt} onChange={e => setCreateForm(f => ({ ...f, diagnoseHaupt: e.target.value }))} placeholder="z.B. COPD Grad IV" className={cls}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Pflegegrad</label><select value={createForm.pflegegrad} onChange={e => setCreateForm(f => ({ ...f, pflegegrad: e.target.value }))} className={cls}>{['PG1','PG2','PG3','PG4','PG5'].map(v => <option key={v} value={v}>Pflegegrad {v.replace('PG','')}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Kostenträger / Krankenkasse</label><input value={createForm.kostentraeger} onChange={e => setCreateForm(f => ({ ...f, kostentraeger: e.target.value }))} placeholder="z.B. AOK Rheinland" className={cls}/></div>
            </div>
            <div><label className="block text-xs font-medium text-charcoal mb-1">Heimadresse des Patienten *</label><textarea value={createForm.adresse} onChange={e => setCreateForm(f => ({ ...f, adresse: e.target.value }))} rows={2} placeholder="Straße, PLZ, Ort" className={`${cls} resize-none`}/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs font-medium text-charcoal mb-1">Notfallkontakt Name</label><input value={createForm.notfallkontaktName} onChange={e => setCreateForm(f => ({ ...f, notfallkontaktName: e.target.value }))} className={cls}/></div>
              <div><label className="block text-xs font-medium text-charcoal mb-1">Notfallkontakt Telefon</label><input value={createForm.notfallkontaktTel} onChange={e => setCreateForm(f => ({ ...f, notfallkontaktTel: e.target.value }))} className={cls}/></div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={createForm.beatmungspflichtig} onChange={e => setCreateForm(f => ({ ...f, beatmungspflichtig: e.target.checked }))} className="accent-teal-500"/> 🫁 Beatmungspflichtig</label>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={createForm.tracheostoma} onChange={e => setCreateForm(f => ({ ...f, tracheostoma: e.target.checked }))} className="accent-teal-500"/> Tracheostoma vorhanden</label>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Abbrechen</button>
              <button onClick={() => createMutation.mutate(createForm)} disabled={createMutation.isPending || !createForm.vorname || !createForm.nachname || !createForm.diagnoseHaupt || !createForm.adresse}
                className="px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-medium hover:bg-teal-600 disabled:opacity-50">➕ {createMutation.isPending ? 'Anlegen…' : 'Patienten anlegen'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
