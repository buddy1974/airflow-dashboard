import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Euro, TrendingUp, TrendingDown } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Badge from '../components/Badge'
import StatCard from '../components/StatCard'
import api from '../lib/api'

interface Invoice { id: string; rechnungsnummer: string; betrag: number; mwst: number; status: string; faelligkeitsdatum: string; patient?: { vorname: string; nachname: string } }
interface Transaction { id: string; typ: string; betrag: number; beschreibung: string; datum: string; kategorie?: string }
interface Summary { totalEinnahmen: number; totalAusgaben: number; balance: number; invoicesPending: number; invoicesOverdue: number }

export default function FinancePage() {
  const [tab, setTab] = useState<'invoices' | 'transactions'>('invoices')

  const { data: invoices, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn:  () => api.get<{ success: boolean; invoices: Invoice[] }>('/invoices').then(r => r.data.invoices),
  })
  const { data: transactions } = useQuery({
    queryKey: ['transactions'],
    queryFn:  () => api.get<{ success: boolean; transactions: Transaction[] }>('/finance/transactions').then(r => r.data.transactions),
  })
  const { data: summary } = useQuery({
    queryKey: ['finance-summary'],
    queryFn:  () => api.get<{ success: boolean; summary: Summary }>('/finance/summary').then(r => r.data.summary),
  })

  return (
    <div>
      <PageHeader title="Finanzen" subtitle="Rechnungen & Transaktionen" />

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Einnahmen"           value={`${summary.totalEinnahmen.toFixed(2)} €`} icon={<TrendingUp size={20}/>} color="teal"/>
          <StatCard label="Ausgaben"            value={`${summary.totalAusgaben.toFixed(2)} €`}  icon={<TrendingDown size={20}/>} color="red"/>
          <StatCard label="Offene Rechnungen"   value={summary.invoicesPending}                   icon={<Euro size={20}/>} color="yellow"/>
          <StatCard label="Überfällig"          value={summary.invoicesOverdue}                   icon={<Euro size={20}/>} color="red"/>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {(['invoices', 'transactions'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? 'bg-teal-500 text-white' : 'bg-white text-charcoal border border-gray-200 hover:border-teal-300'}`}>
            {t === 'invoices' ? 'Rechnungen' : 'Transaktionen'}
          </button>
        ))}
      </div>

      {tab === 'invoices' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {invoicesLoading ? <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-teal-500 border-t-transparent rounded-full"/></div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Rechnungsnr.</th>
                  <th className="px-4 py-3 text-left">Patient</th>
                  <th className="px-4 py-3 text-left">Betrag</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Fällig</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(invoices ?? []).map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-sm font-medium text-teal-600">{inv.rechnungsnummer}</td>
                    <td className="px-4 py-3">{inv.patient ? `${inv.patient.vorname} ${inv.patient.nachname}` : '—'}</td>
                    <td className="px-4 py-3 font-semibold">{(inv.betrag * (1 + inv.mwst / 100)).toFixed(2)} €</td>
                    <td className="px-4 py-3"><Badge status={inv.status}/></td>
                    <td className="px-4 py-3 text-charcoal-lighter">{new Date(inv.faelligkeitsdatum).toLocaleDateString('de-DE')}</td>
                  </tr>
                ))}
                {!invoices?.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-charcoal-lighter">Keine Rechnungen</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'transactions' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-charcoal-lighter uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Typ</th>
                <th className="px-4 py-3 text-left">Beschreibung</th>
                <th className="px-4 py-3 text-left">Betrag</th>
                <th className="px-4 py-3 text-left">Kategorie</th>
                <th className="px-4 py-3 text-left">Datum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(transactions ?? []).map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><Badge status={t.typ}/></td>
                  <td className="px-4 py-3 font-medium">{t.beschreibung}</td>
                  <td className={`px-4 py-3 font-semibold ${t.typ === 'EINNAHME' ? 'text-teal-600' : 'text-red-600'}`}>
                    {t.typ === 'EINNAHME' ? '+' : '-'}{t.betrag.toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-charcoal-lighter">{t.kategorie ?? '—'}</td>
                  <td className="px-4 py-3 text-charcoal-lighter">{new Date(t.datum).toLocaleDateString('de-DE')}</td>
                </tr>
              ))}
              {!transactions?.length && <tr><td colSpan={5} className="px-4 py-8 text-center text-charcoal-lighter">Keine Transaktionen</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
