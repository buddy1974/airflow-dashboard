import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Activity } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import api from '../lib/api'

interface Patient {
  id: string; vorname: string; nachname: string; diagnoseHaupt: string
  pflegegrad: string; beatmungspflichtig: boolean; status: string
  location?: { name: string }
}

export default function PatientsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['patients'],
    queryFn:  () => api.get<{ success: boolean; patients: Patient[] }>('/patients').then(r => r.data.patients),
  })

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>
  if (error) return <div className="p-6 text-red-600 bg-red-50 rounded-xl">Fehler beim Laden der Patienten</div>

  return (
    <div>
      <PageHeader title="Patienten" subtitle={`${data?.length ?? 0} Patienten`} />
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Diagnose</th>
              <th className="px-4 py-3 text-left">Pflegegrad</th>
              <th className="px-4 py-3 text-left">Beatmung</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Standort</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data ?? []).map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-charcoal">{p.vorname} {p.nachname}</td>
                <td className="px-4 py-3 text-charcoal-lighter max-w-xs truncate">{p.diagnoseHaupt}</td>
                <td className="px-4 py-3"><span className="font-semibold text-teal-600">{p.pflegegrad}</span></td>
                <td className="px-4 py-3">
                  {p.beatmungspflichtig ? <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Ja</span> : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Nein</span>}
                </td>
                <td className="px-4 py-3"><Badge status={p.status}/></td>
                <td className="px-4 py-3 text-charcoal-lighter">{p.location?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <Link to={`/monitoring/${p.id}`} className="flex items-center gap-1 text-teal-600 hover:text-teal-700 text-xs font-medium">
                    <Activity size={14}/> Monitoring
                  </Link>
                </td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-charcoal-lighter">Keine Patienten</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
