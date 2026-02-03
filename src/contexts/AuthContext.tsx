import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { isAuthenticated as checkAuth } from '../lib/auth'

interface AuthContextValue {
  isAuthenticated: boolean
  setAuthenticated: (value: boolean) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(checkAuth)

  useEffect(() => {
    const syncAuth = () => setAuthenticated(checkAuth())
    syncAuth()
    window.addEventListener('storage', syncAuth)
    window.addEventListener('auth:changed', syncAuth)
    return () => {
      window.removeEventListener('storage', syncAuth)
      window.removeEventListener('auth:changed', syncAuth)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ isAuthenticated: authenticated, setAuthenticated }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
