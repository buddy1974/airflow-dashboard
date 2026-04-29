import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import api from '../lib/api'

interface Device {
  id: string; bezeichnung: string; typ: string; status: string
  naechsteWartung?: string; hersteller?: string; modell?: string
  patient?: { vorname: string; nachname: string }
  location?: { name: string }
}

export default function DevicesPage() {
  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices'],
    queryFn:  () => api.get<{ success: boolean; devices: Device[] }>('/devices').then(r => r.data.devices),
  })
  const { data: maintenance } = useQuery({
    queryKey: ['devices-maintenance'],
    queryFn:  () => api.get<{ success: boolean; devices: Device[] }>('/devices/maintenance-due').then(r => r.data.devices),
  })

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  return (
    <div>
      <PageHeader title="Gerätemanagement" subtitle={`${devices?.length ?? 0} Geräte`} />

      {maintenance && maintenance.length > 0 && (
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-orange-800">
          <AlertTriangle size={18} className="flex-shrink-0"/>
          <span><strong>{maintenance.length}</strong> Gerät{maintenance.length !== 1 ? 'e' : ''} mit fälliger Wartung in den nächsten 14 Tagen</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Bezeichnung</th>
              <th className="px-4 py-3 text-left">Typ</th>
              <th className="px-4 py-3 text-left">Hersteller</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Patient</th>
              <th className="px-4 py-3 text-left">Nächste Wartung</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(devices ?? []).map(d => (
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-charcoal">{d.bezeichnung}</td>
                <td className="px-4 py-3 text-charcoal-lighter">{d.typ}</td>
                <td className="px-4 py-3 text-charcoal-lighter">{d.hersteller ?? '—'} {d.modell}</td>
                <td className="px-4 py-3"><Badge status={d.status}/></td>
                <td className="px-4 py-3 text-charcoal-lighter">{d.patient ? `${d.patient.vorname} ${d.patient.nachname}` : '—'}</td>
                <td className="px-4 py-3 text-charcoal-lighter">{d.naechsteWartung ? new Date(d.naechsteWartung).toLocaleDateString('de-DE') : '—'}</td>
              </tr>
            ))}
            {!devices?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal-lighter">Keine Geräte</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
