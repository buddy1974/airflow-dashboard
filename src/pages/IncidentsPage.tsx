import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import api from '../lib/api'

interface Incident {
  id: string; titel: string; beschreibung: string; severity: string; status: string
  occurredAt: string; mdkMeldepflichtig: boolean
  patient?: { vorname: string; nachname: string }
}

const SEVERITY_FILTERS = ['', 'NIEDRIG', 'MITTEL', 'HOCH', 'KRITISCH']

export default function IncidentsPage() {
  const [severityFilter, setSeverityFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['incidents', severityFilter],
    queryFn:  () => {
      const params = severityFilter ? `?severity=${severityFilter}` : ''
      return api.get<{ success: boolean; incidents: Incident[] }>(`/incidents${params}`).then(r => r.data.incidents)
    },
  })

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  return (
    <div>
      <PageHeader
        title="Vorfälle"
        action={
          <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400">
            <option value="">Alle Schweregrade</option>
            {SEVERITY_FILTERS.slice(1).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        }
      />
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Titel</th>
              <th className="px-4 py-3 text-left">Patient</th>
              <th className="px-4 py-3 text-left">Schweregrad</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">MDK</th>
              <th className="px-4 py-3 text-left">Datum</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data ?? []).map(i => (
              <tr key={i.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-charcoal max-w-xs truncate">{i.titel}</td>
                <td className="px-4 py-3">{i.patient ? `${i.patient.vorname} ${i.patient.nachname}` : '—'}</td>
                <td className="px-4 py-3"><Badge status={i.severity}/></td>
                <td className="px-4 py-3"><Badge status={i.status}/></td>
                <td className="px-4 py-3">{i.mdkMeldepflichtig ? <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">Ja</span> : '—'}</td>
                <td className="px-4 py-3 text-charcoal-lighter">{new Date(i.occurredAt).toLocaleDateString('de-DE')}</td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={6} className="px-4 py-8 text-center text-charcoal-lighter">Keine Vorfälle</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
