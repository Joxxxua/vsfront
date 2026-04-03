const ACCESS_TOKEN_KEY = 'clinic_admin_access_token'
const REFRESH_TOKEN_KEY = 'clinic_admin_refresh_token'
const SESSION_EMAIL_KEY = 'clinic_admin_session_email'
const AUTH_EVENT = 'auth:changed'

function notifyAuthChanged(): void {
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  if (refreshToken != null) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  }
  notifyAuthChanged()
}

/** E-mail usado no último login (para exibir no painel; o token pode não trazer claims legíveis). */
export function setSessionEmail(email: string): void {
  localStorage.setItem(SESSION_EMAIL_KEY, email.trim())
}

export function getSessionEmail(): string | null {
  const v = localStorage.getItem(SESSION_EMAIL_KEY)
  return v && v.trim() ? v.trim() : null
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = base64.length % 4
    if (pad) base64 += '='.repeat(4 - pad)
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

function strClaim(payload: Record<string, unknown> | null, key: string): string | null {
  if (!payload) return null
  const v = payload[key]
  return typeof v === 'string' && v.trim() ? v.trim() : null
}

function extractInitials(label: string): string {
  const t = label.trim()
  if (!t) return '?'
  if (t.includes('@')) {
    const local = t.split('@')[0] ?? t
    const clean = local.replace(/[^a-zA-ZÀ-ÿ0-9]/g, '')
    return (clean.slice(0, 2) || t.slice(0, 2)).toUpperCase()
  }
  const parts = t.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0][0] ?? ''
    const b = parts[parts.length - 1][0] ?? ''
    return (a + b).toUpperCase()
  }
  return t.slice(0, 2).toUpperCase()
}

/** Dados para o cabeçalho / página de perfil (sessão + claims do JWT quando existirem). */
export function getSessionUserDisplay(): {
  email: string | null
  name: string | null
  initials: string
} {
  const token = getAccessToken()
  const payload = token ? parseJwtPayload(token) : null
  const emailFromJwt =
    strClaim(payload, 'email') ??
    (() => {
      const sub = strClaim(payload, 'sub')
      return sub && sub.includes('@') ? sub : null
    })()
  const email = getSessionEmail() ?? emailFromJwt
  const name =
    strClaim(payload, 'name') ??
    strClaim(payload, 'nome') ??
    strClaim(payload, 'given_name')
  const label = name || email || 'Usuário'
  return {
    email,
    name,
    initials: extractInitials(label),
  }
}

export function clearAuth(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(SESSION_EMAIL_KEY)
  notifyAuthChanged()
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}
