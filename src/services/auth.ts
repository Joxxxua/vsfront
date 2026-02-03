import { setTokens, clearAuth } from '../lib/auth'
import { ApiError } from '../lib/api'
import type { LoginCredentials, AuthResponse } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
  if (res.status === 401) {
    throw new ApiError('Credenciais inválidas', 401)
  }
  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = await res.text()
    }
    throw new ApiError(res.statusText, res.status, body)
  }
  const data = (await res.json()) as AuthResponse
  if (data?.access_token) {
    setTokens(data.access_token, data.refresh_token)
  }
  return data
}

export async function logout(): Promise<void> {
  const { getAccessToken } = await import('../lib/auth')
  const token = getAccessToken()
  if (token) {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    } finally {
      clearAuth()
    }
  } else {
    clearAuth()
  }
}

export function clearSession(): void {
  clearAuth()
}
