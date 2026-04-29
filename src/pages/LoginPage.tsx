import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../lib/api'

interface LoginResponse {
  success: boolean
  token: string
  user: { id: string; email: string; name: string; role: 'ADMIN' | 'PFLEGEKRAFT' | 'ANGEHOERIGE' | 'ARZT' }
}

function DandelionLogo({ size = 56 }: { size?: number }) {
  const c = size / 2, r = size * 0.09
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={c} cy={c} r={r} fill="#00ABA8"/>
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x1 = c + (r + 2) * Math.cos(rad), y1 = c + (r + 2) * Math.sin(rad)
        const x2 = c + (size * 0.37) * Math.cos(rad), y2 = c + (size * 0.37) * Math.sin(rad)
        return (
          <g key={deg}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00ABA8" strokeWidth={size * 0.038} strokeLinecap="round"/>
            <circle cx={x2} cy={y2} r={size * 0.072} fill="#00ABA8"/>
          </g>
        )
      })}
    </svg>
  )
}

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

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
      setError('E-Mail oder Passwort falsch. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    /* Full-screen teal gradient on mobile, grey on desktop */
    <div className="min-h-[100dvh] bg-gradient-to-br from-teal-500 to-teal-700 md:bg-gray-50 flex items-center justify-center p-4">

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 md:p-8">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <DandelionLogo size={56}/>
          <div className="mt-3 text-center">
            {/* Larger on mobile for readability */}
            <span className="italic text-charcoal text-2xl md:text-2xl font-light">airflow</span>
            <span className="block text-sm font-bold text-teal-500 mt-0.5">Fachpflegedienst Krefeld</span>
          </div>
          <p className="text-xs text-charcoal-lighter mt-2">CareOS Management</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">E-Mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              /* font-size 16px prevents iOS zoom */
              className="w-full h-[52px] border border-gray-300 rounded-xl px-4 text-base focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              placeholder="name@airflow.de"
              autoComplete="email"
              inputMode="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">Passwort</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full h-[52px] border border-gray-300 rounded-xl px-4 text-base focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-[52px] bg-teal-500 hover:bg-teal-600 active:bg-teal-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 text-base"
          >
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>

        {/* Quick access pills */}
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-gray-200"/>
            <span className="text-xs text-charcoal-lighter whitespace-nowrap">Schnellzugriff</span>
            <div className="flex-1 h-px bg-gray-200"/>
          </div>
          {/* Stacked vertically on mobile, side-by-side on larger screens */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => fill('admin@airflow.de', '12345678')}
              className="flex-1 h-12 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 active:bg-teal-700 transition-colors"
            >
              R. Koroma · PDL
            </button>
            <button
              type="button"
              onClick={() => fill('pflege@airflow.de', '12345678')}
              className="flex-1 h-12 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 active:bg-teal-700 transition-colors"
            >
              Pflegekraft Test
            </button>
          </div>
          <p className="text-[10px] text-charcoal-lighter text-center mt-2">Zum Ausfüllen tippen</p>
        </div>
      </div>
    </div>
  )
}
