import { api } from '../lib/api'
import { setTokens, clearAuth } from '../lib/auth'
import type { LoginCredentials, AuthResponse } from '../types'

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const data = await api.post<AuthResponse>('/clinicas/login', credentials)
  if (data?.access_token) {
    setTokens(data.access_token, data.refresh_token)
  }
  return data as AuthResponse
}

export function clearSession(): void {
  clearAuth()
}
