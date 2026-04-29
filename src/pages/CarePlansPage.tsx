import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import api from '../lib/api'

interface Patient { id: string; vorname: string; nachname: string }
interface CarePlan {
  id: string; titel: string; beschreibung?: string; isActive: boolean
  beatmungsmodus?: string; atemzugvolumen?: number; peep?: number; fio2?: number
  pflegeziele?: string; massnahmen?: string; gueltigAb: string; gueltigBis?: string
}

export default function CarePlansPage() {
  const [selectedPatientId, setSelectedPatientId] = useState('')

  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn:  () => api.get<{ success: boolean; patients: Patient[] }>('/patients').then(r => r.data.patients),
  })

  const { data: carePlan, isLoading } = useQuery({
    queryKey: ['care-plan-active', selectedPatientId],
    queryFn:  () => api.get<{ success: boolean; carePlan: CarePlan | null }>(`/care-plans/patient/${selectedPatientId}/active`).then(r => r.data.carePlan),
    enabled: !!selectedPatientId,
  })

  return (
    <div>
      <PageHeader title="Pflegepläne" subtitle="Aktiver Pflegeplan je Patient" />

      <div className="mb-4">
        <select
          value={selectedPatientId}
          onChange={e => setSelectedPatientId(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 w-full max-w-sm"
        >
          <option value="">— Patient auswählen —</option>
          {(patients ?? []).map(p => (
            <option key={p.id} value={p.id}>{p.vorname} {p.nachname}</option>
          ))}
        </select>
      </div>

      {selectedPatientId && isLoading && <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"/></div>}

      {selectedPatientId && !isLoading && !carePlan && (
        <div className="bg-white rounded-xl shadow-sm p-8 text-center text-charcoal-lighter">Kein aktiver Pflegeplan vorhanden</div>
      )}

      {carePlan && (
        <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-semibold text-charcoal">{carePlan.titel}</h3>
            <Badge status={carePlan.isActive ? 'AKTIV' : 'ENTWURF'}/>
          </div>
          {carePlan.beschreibung && <p className="text-sm text-charcoal-lighter">{carePlan.beschreibung}</p>}

          {(carePlan.beatmungsmodus || carePlan.atemzugvolumen || carePlan.peep || carePlan.fio2) && (
            <div>
              <h4 className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-2">Beatmungsparameter</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {carePlan.beatmungsmodus && <div className="bg-teal-50 rounded-lg p-3"><p className="text-xs text-teal-600 font-medium">Modus</p><p className="text-sm font-semibold">{carePlan.beatmungsmodus}</p></div>}
                {carePlan.atemzugvolumen && <div className="bg-teal-50 rounded-lg p-3"><p className="text-xs text-teal-600 font-medium">AZV</p><p className="text-sm font-semibold">{carePlan.atemzugvolumen} ml</p></div>}
                {carePlan.peep && <div className="bg-teal-50 rounded-lg p-3"><p className="text-xs text-teal-600 font-medium">PEEP</p><p className="text-sm font-semibold">{carePlan.peep} cmH₂O</p></div>}
                {carePlan.fio2 && <div className="bg-teal-50 rounded-lg p-3"><p className="text-xs text-teal-600 font-medium">FiO₂</p><p className="text-sm font-semibold">{(carePlan.fio2 * 100).toFixed(0)}%</p></div>}
              </div>
            </div>
          )}
          {carePlan.pflegeziele && <div><h4 className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1">Pflegeziele</h4><p className="text-sm">{carePlan.pflegeziele}</p></div>}
          {carePlan.massnahmen && <div><h4 className="text-xs font-semibold text-charcoal-lighter uppercase tracking-wider mb-1">Maßnahmen</h4><p className="text-sm">{carePlan.massnahmen}</p></div>}
          <p className="text-xs text-charcoal-lighter">Gültig ab {new Date(carePlan.gueltigAb).toLocaleDateString('de-DE')}{carePlan.gueltigBis ? ` bis ${new Date(carePlan.gueltigBis).toLocaleDateString('de-DE')}` : ''}</p>
        </div>
      )}
    </div>
  )
}
