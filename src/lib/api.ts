import { getAccessToken, getRefreshToken, setTokens, clearAuth } from './auth'

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  status: number
  body?: unknown
  constructor(message: string, status: number, body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

interface AuthTokens {
  access_token: string
  refresh_token: string
}

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${refreshToken}`,
    },
  })
  if (!res.ok) return false
  const data = (await res.json()) as AuthTokens
  if (data?.access_token) {
    setTokens(data.access_token, data.refresh_token)
    return true
  }
  return false
}

async function fetchWithToken(
  path: string,
  options: RequestInit,
  token: string | null
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return fetch(`${BASE_URL}${path}`, { ...options, headers })
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = getAccessToken()
  let res = await fetchWithToken(path, options, token)

  if (res.status === 401) {
    if (token) {
      const refreshed = await refreshTokens()
      if (refreshed) {
        token = getAccessToken()
        res = await fetchWithToken(path, options, token)
      }
      if (res.status === 401 || !token) {
        clearAuth()
        window.location.href = '/login'
        throw new ApiError('Não autorizado', 401)
      }
    } else {
      throw new ApiError('Credenciais inválidas', 401)
    }
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

  const contentType = res.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    return res.json() as Promise<T>
  }
  return undefined as T
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
}
