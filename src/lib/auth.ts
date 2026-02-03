const ACCESS_TOKEN_KEY = 'clinic_admin_access_token'
const REFRESH_TOKEN_KEY = 'clinic_admin_refresh_token'
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

export function clearAuth(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  notifyAuthChanged()
}

export function isAuthenticated(): boolean {
  return !!getAccessToken()
}
