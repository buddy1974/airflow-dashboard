import { useQuery } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import api from '../lib/api'

interface User { id: string; email: string; name: string; role: string; isActive: boolean; createdAt: string }

export default function UsersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn:  () => api.get<{ success: boolean; users: User[] }>('/users').then(r => r.data.users),
  })

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  return (
    <div>
      <PageHeader title="Benutzerverwaltung" subtitle={`${data?.length ?? 0} Benutzer`} />
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">E-Mail</th>
              <th className="px-4 py-3 text-left">Rolle</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Erstellt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data ?? []).map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-charcoal">{u.name}</td>
                <td className="px-4 py-3 text-charcoal-lighter">{u.email}</td>
                <td className="px-4 py-3"><Badge status={u.role}/></td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'}`}>
                    {u.isActive ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="px-4 py-3 text-charcoal-lighter">{new Date(u.createdAt).toLocaleDateString('de-DE')}</td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-charcoal-lighter">Keine Benutzer</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
