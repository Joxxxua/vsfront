import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { login } from '../services/auth'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../lib/api'
import './LoginPage.css'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => {
    const authError = sessionStorage.getItem('auth_error')
    if (authError) {
      setError(authError)
      sessionStorage.removeItem('auth_error')
    }
  }, [])

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
      let msg = getApiErrorMessage(err, 'Erro inesperado. Tente novamente.', {
        unauthorized: 'Credenciais inválidas.',
        validation: 'Dados inválidos. Verifique e tente novamente.',
      })
      if (msg === 'Erro inesperado. Tente novamente.' && err instanceof TypeError) {
        msg = 'Não foi possível conectar à API. Em localhost, verifique se a API libera CORS para este endereço ou use o front em produção.'
      }
      setError(msg)
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
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
              autoComplete="current-password"
            />
          </label>
          <label className="login-show-password">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            <span>Mostrar senha</span>
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
