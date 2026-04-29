import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Badge from '../components/Badge'
import api from '../lib/api'

interface PortalPatient {
  id: string; vorname: string; nachname: string; diagnoseHaupt: string
  pflegegrad: string; unreadMessages?: number; alertLevel?: string
}

export default function PortalDashboardPage() {
  const { token, user, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!token) navigate('/portal/login', { replace: true })
  }, [token, navigate])

  const { data: patients, isLoading } = useQuery({
    queryKey: ['portal-patients'],
    queryFn:  () => api.get<{ success: boolean; patients: PortalPatient[] }>('/portal/meine-patienten').then(r => r.data.patients).catch(() => [] as PortalPatient[]),
    enabled: !!token,
  })

  const handleLogout = () => { logout(); navigate('/portal/login') }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-teal-500 text-white px-6 py-4 flex items-center justify-between shadow">
        <div>
          <h1 className="font-bold text-lg">airflow Angehörigen-Portal</h1>
          <p className="text-xs text-teal-100">Willkommen, {user?.name ?? 'Angehöriger'}</p>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm text-teal-100 hover:text-white">
          <LogOut size={16}/> Abmelden
        </button>
      </header>

      <main className="p-6 max-w-3xl mx-auto">
        <h2 className="text-lg font-bold text-charcoal mb-4">Ihre Patienten</h2>

        {isLoading && <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"/></div>}

        {!isLoading && !patients?.length && (
          <div className="bg-white rounded-xl p-8 text-center text-charcoal-lighter shadow-sm">
            Keine Patienten zugeordnet. Bitte wenden Sie sich an das Pflegeteam.
          </div>
        )}

        <div className="grid gap-4">
          {(patients ?? []).map(p => (
            <Link key={p.id} to={`/portal/patient/${p.id}`}
              className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow border-l-4 border-teal-400 flex items-start justify-between group">
              <div>
                <h3 className="font-bold text-charcoal text-lg">{p.vorname} {p.nachname}</h3>
                <p className="text-sm text-charcoal-lighter mt-0.5 line-clamp-2">{p.diagnoseHaupt}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge status={p.pflegegrad}/>
                  {p.alertLevel && p.alertLevel !== 'GRUEN' && <Badge status={p.alertLevel}/>}
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                {p.unreadMessages ? (
                  <span className="inline-flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full">
                    {p.unreadMessages}
                  </span>
                ) : null}
                <p className="text-xs text-teal-600 mt-2 group-hover:underline">Öffnen →</p>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
