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
    <svg width="40" height="40" viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="4.5" fill="#00ABA8" />
      {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
        const rad = (deg * Math.PI) / 180
        const x2 = 24 + 18 * Math.cos(rad), y2 = 24 + 18 * Math.sin(rad)
        return <circle key={deg} cx={x2} cy={y2} r="3.5" fill="#00ABA8" />
      })}
    </svg>
  )
}

export default function PortalLoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
      if (data.user.role !== 'ANGEHOERIGE') {
        setError('Dieser Zugang ist nur für Familienangehörige.')
        return
      }
      login(data.token, data.user)
      navigate('/portal/dashboard', { replace: true })
    } catch {
      setError('E-Mail oder Passwort falsch.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-teal-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        <div className="flex flex-col items-center mb-8">
          <DandelionLogo />
          <div className="mt-3 text-center">
            <span className="italic text-charcoal text-xl font-light">airflow</span>
            <span className="block text-xs font-bold text-teal-500">Fachpflegedienst Krefeld</span>
          </div>
          <h1 className="mt-4 text-lg font-bold text-charcoal">Angehörigen-Portal</h1>
          <p className="text-sm text-charcoal-lighter mt-1">Zugang für Familienangehörige</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">E-Mail</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="name@beispiel.de" />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1">Passwort</label>
            <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400"
              placeholder="••••••••" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60">
            {loading ? 'Anmelden…' : 'Anmelden'}
          </button>
        </form>
      </div>
    </div>
  )
}
