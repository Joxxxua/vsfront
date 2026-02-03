import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login } from '../services/auth'
import { useAuth } from '../contexts/AuthContext'
import { ApiError } from '../lib/api'
import './LoginPage.css'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, setAuthenticated } = useAuth()

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  if (isAuthenticated) {
    navigate(from, { replace: true })
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
      setAuthenticated(true)
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        const msg = typeof err.body === 'object' && err.body && 'message' in err.body
          ? String((err.body as { message: unknown }).message)
          : err.message
        if (err.status === 401) {
          setError(msg || 'Invalid credentials')
        } else {
          setError(msg || 'Falha no login.')
        }
      } else {
        setError('Falha no login. Tente novamente.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Painel da Clínica</h1>
        <p className="login-subtitle">Entre com as credenciais da clínica</p>
        <form onSubmit={handleSubmit}>
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@clinica.com"
              required
              autoComplete="email"
            />
          </label>
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </label>
          {error && <p className="login-error">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
