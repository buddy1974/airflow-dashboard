import { useQuery } from '@tanstack/react-query'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import api from '../lib/api'

interface PayrollRecord {
  id: string; monat: number; jahr: number; grundgehalt: number; zuschlaege: number; abzuege: number; netto: number; status: string
  user?: { id: string; name: string; email: string }
}

const MONTHS_DE = ['', 'Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

export default function PayrollPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['payroll'],
    queryFn:  () => api.get<{ success: boolean; records: PayrollRecord[] }>('/payroll').then(r => r.data.records),
  })

  if (isLoading) return <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 border-4 border-teal-500 border-t-transparent rounded-full"/></div>

  return (
    <div>
      <PageHeader title="Gehaltsabrechnung" subtitle={`${data?.length ?? 0} Einträge`} />
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Mitarbeiter</th>
              <th className="px-4 py-3 text-left">Zeitraum</th>
              <th className="px-4 py-3 text-left">Grundgehalt</th>
              <th className="px-4 py-3 text-left">Zuschläge</th>
              <th className="px-4 py-3 text-left">Abzüge</th>
              <th className="px-4 py-3 text-left font-bold">Netto</th>
              <th className="px-4 py-3 text-left">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(data ?? []).map(r => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-charcoal">{r.user?.name ?? '—'}</td>
                <td className="px-4 py-3 text-charcoal-lighter">{MONTHS_DE[r.monat]} {r.jahr}</td>
                <td className="px-4 py-3">{r.grundgehalt.toFixed(2)} €</td>
                <td className="px-4 py-3 text-teal-600">+{r.zuschlaege.toFixed(2)} €</td>
                <td className="px-4 py-3 text-red-500">-{r.abzuege.toFixed(2)} €</td>
                <td className="px-4 py-3 font-bold text-charcoal">{r.netto.toFixed(2)} €</td>
                <td className="px-4 py-3"><Badge status={r.status}/></td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={7} className="px-4 py-8 text-center text-charcoal-lighter">Keine Gehaltsabrechnungen</td></tr>}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
