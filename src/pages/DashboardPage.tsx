import { useQuery } from '@tanstack/react-query'
import { CheckSquare, Clock, AlertCircle, XCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import Badge from '../components/Badge'
import api from '../lib/api'

interface Task {
  id: string; title: string; status: string; priority: string; dueDate?: string
  location?: { name: string }
}
interface TaskSummary { total: number; pending: number; inProgress: number; completed: number; urgent: number }

export default function DashboardPage() {
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn:  () => api.get<{ success: boolean; tasks: Task[] }>('/tasks').then(r => r.data.tasks),
  })
  const { data: summary } = useQuery({
    queryKey: ['tasks-summary'],
    queryFn:  () => api.get<{ success: boolean; summary: TaskSummary }>('/tasks/summary').then(r => r.data.summary),
  })

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Aufgabenübersicht" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Gesamt"      value={summary?.total ?? 0}      icon={<CheckSquare size={20}/>} />
        <StatCard label="Ausstehend"  value={summary?.pending ?? 0}    icon={<Clock size={20}/>}       color="yellow" />
        <StatCard label="In Arbeit"   value={summary?.inProgress ?? 0} icon={<AlertCircle size={20}/>} color="orange" />
        <StatCard label="Dringend"    value={summary?.urgent ?? 0}     icon={<XCircle size={20}/>}     color="red" />
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Aufgabe</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Priorität</th>
              <th className="px-4 py-3 text-left">Fällig</th>
              <th className="px-4 py-3 text-left">Standort</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(tasksData ?? []).map(t => (
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-charcoal">{t.title}</td>
                <td className="px-4 py-3"><Badge status={t.status}/></td>
                <td className="px-4 py-3"><Badge status={t.priority}/></td>
                <td className="px-4 py-3 text-charcoal-lighter">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('de-DE') : '—'}</td>
                <td className="px-4 py-3 text-charcoal-lighter">{t.location?.name ?? '—'}</td>
              </tr>
            ))}
            {!tasksData?.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-charcoal-lighter">Keine Aufgaben</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
