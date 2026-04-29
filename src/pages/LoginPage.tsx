import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

interface LoginResponse {
  success: boolean
  token: string
  user: { id: string; email: string; name: string; role: 'ADMIN' | 'PFLEGEKRAFT' | 'ANGEHOERIGE' | 'ARZT' }
}

function DandelionLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="4.5" fill="#00ABA8" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x1 = 24 + 5.5 * Math.cos(rad), y1 = 24 + 5.5 * Math.sin(rad)
        const x2 = 24 + 18 * Math.cos(rad),  y2 = 24 + 18 * Math.sin(rad)
        return (
          <g key={deg}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00ABA8" strokeWidth="2" strokeLinecap="round" />
            <circle cx={x2} cy={y2} r="3.5" fill="#00ABA8" />
          </g>
        )
      })}
    </svg>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const fill = (e: string, p: string) => { setEmail(e); setPassword(p) }

  const handleSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
      login(data.token, data.user)
      navigate(data.user.role === 'ADMIN' ? '/pdl-onboarding' : '/dashboard', { replace: true })
    } catch {
      setError('E-Mail oder Passwort falsch.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm p-8">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <DandelionLogo />
          <div className="mt-3 text-center">
            <span className="italic text-charcoal text-2xl font-light">airflow</span>
            <span className="block text-sm font-bold text-teal-500">Fachpflegedienst</span>
          </div>
          <p className="text-xs text-charcoal-lighter mt-1">CareOS Management</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">E-Mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="name@airflow.de"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Passwort</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>

        {/* Quick access pills */}
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-charcoal-lighter whitespace-nowrap">Schnellzugriff (zum Ausfüllen klicken)</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          <div className="flex gap-2 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => fill('admin@airflow.de', '12345678')}
              className="bg-teal-500 text-white rounded-full px-4 py-2 text-sm cursor-pointer hover:bg-teal-600 transition-colors"
            >
              R. Koroma · PDL
            </button>
            <button
              type="button"
              onClick={() => fill('pflege@airflow.de', '12345678')}
              className="bg-teal-500 text-white rounded-full px-4 py-2 text-sm cursor-pointer hover:bg-teal-600 transition-colors"
            >
              Pflegekraft Test
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
