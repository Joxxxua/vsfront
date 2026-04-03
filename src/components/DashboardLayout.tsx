import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getSessionUserDisplay } from '../lib/auth'
import { logout } from '../services/auth'
import './DashboardLayout.css'
import logoImg from '../assets/ChatGPT_Image_6_de_fev._de_2026__23_17_35-removebg-preview.png'

function currentSectionLabel(pathname: string): string {
  if (pathname === '/' || pathname === '') return 'Agendamentos'
  if (pathname === '/perfil') return 'Perfil'
  return ''
}

export function DashboardLayout() {
  const { setAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [profileOpen, setProfileOpen] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)
  const { email, name, initials } = getSessionUserDisplay()

  useEffect(() => {
    if (!profileOpen) return
    function onPointerDown(e: PointerEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [profileOpen])

  useEffect(() => {
    setProfileOpen(false)
  }, [location.pathname])

  async function handleLogout() {
    setAuthenticated(false)
    await logout()
    navigate('/login', { replace: true })
  }

  const section = currentSectionLabel(location.pathname)

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="brand">
            <img
              src={logoImg}
              alt="Logo VS"
              className="brand-logo-img"
            />
            <div className="brand-text">
              <strong>Painel Clínica</strong>
              <span>Agendamentos</span>
            </div>
          </div>
        </div>

        <div className="header-center">
          <nav className="dashboard-nav" aria-label="Principal" />
        </div>

        <div className="header-right">
          {section ? (
            <div className="location-tag">
              <span className="location-dot" />
              <span className="location-text">Painel • {section}</span>
            </div>
          ) : null}
          <div className="profile-zone" ref={profileRef}>
            <button
              type="button"
              className="profile-trigger"
              onClick={() => setProfileOpen((o) => !o)}
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              aria-label="Menu da conta"
            >
              <span className="profile-avatar" aria-hidden="true">
                {initials}
              </span>
              <span className="profile-text">
                <span className="profile-name">{name || 'Minha conta'}</span>
                <span className="profile-email">{email ?? 'Sessão ativa'}</span>
              </span>
              <span className={`profile-chevron${profileOpen ? ' is-open' : ''}`} aria-hidden="true" />
            </button>
            {profileOpen ? (
              <div className="profile-dropdown" role="menu">
                <Link
                  to="/perfil"
                  role="menuitem"
                  className="profile-menu-item"
                  onClick={() => setProfileOpen(false)}
                >
                  Meu perfil
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="profile-menu-item profile-menu-danger"
                  onClick={() => {
                    setProfileOpen(false)
                    void handleLogout()
                  }}
                >
                  Sair
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  )
}