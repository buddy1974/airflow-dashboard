import { useQuery } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import api from '../lib/api'

interface Application {
  id: string; vorname: string; nachname: string; email: string
  position: string; status: string; createdAt: string; notizen?: string
}

const COLUMNS: { status: string; label: string }[] = [
  { status: 'EINGEGANGEN',  label: 'Eingegangen'  },
  { status: 'IN_PRUEFUNG',  label: 'In Prüfung'   },
  { status: 'EINGELADEN',   label: 'Eingeladen'   },
  { status: 'EINGESTELLT',  label: 'Eingestellt'  },
]

export default function RecruitmentPage() {
  const { data: applications, isLoading } = useQuery({
    queryKey: ['recruitment'],
    queryFn:  () => api.get<{ success: boolean; applications: Application[] }>('/recruitment').then(r => r.data.applications),
  })

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  return (
    <div>
      <PageHeader title="Bewerbungen" subtitle={`${applications?.length ?? 0} Bewerbungen`} />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {COLUMNS.map(col => {
          const apps = (applications ?? []).filter(a => a.status === col.status)
          return (
            <div key={col.status}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-charcoal">{col.label}</h3>
                <span className="bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">{apps.length}</span>
              </div>
              <div className="space-y-3">
                {apps.map(app => (
                  <div key={app.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:border-teal-200 transition-colors">
                    <p className="font-semibold text-sm text-charcoal">{app.vorname} {app.nachname}</p>
                    <p className="text-xs text-teal-600 mt-0.5">{app.position}</p>
                    <p className="text-xs text-charcoal-lighter mt-1">{app.email}</p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge status={app.status}/>
                      <span className="text-xs text-charcoal-lighter">{new Date(app.createdAt).toLocaleDateString('de-DE')}</span>
                    </div>
                    {app.notizen && <p className="text-xs bg-yellow-50 text-yellow-700 rounded p-2 mt-2">{app.notizen}</p>}
                  </div>
                ))}
                {!apps.length && <div className="bg-gray-50 rounded-xl p-4 text-center text-xs text-charcoal-lighter">Leer</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
