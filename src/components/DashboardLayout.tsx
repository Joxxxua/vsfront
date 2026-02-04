import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { logout } from '../services/auth'
import './DashboardLayout.css'

export function DashboardLayout() {
  const { setAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleLogout() {
    setAuthenticated(false)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div className="header-left">
          <div className="brand">
            <span className="brand-icon" aria-hidden>🌱</span>
            <div className="brand-text">
              <strong>Painel Clínica</strong>
              <span>Gestão do bem-estar da sua equipe</span>
            </div>
          </div>
        </div>
        <div className="header-center">
          <nav className="dashboard-nav">
            <NavLink to="/" end className={({ isActive }) => `nav-chip ${isActive ? 'active' : ''}`}>
              Agendamentos
            </NavLink>
          </nav>
        </div>
        <div className="header-right">
          <div className="location-tag">
            <span className="location-dot" />
            <span className="location-text">Painel • {location.pathname === '/' ? 'Agendamentos' : ''}</span>
          </div>
          <button type="button" className="logout-button" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </header>
      <main className="dashboard-content">
        <Outlet />
      </main>
    </div>
  )
}
