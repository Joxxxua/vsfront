import { Outlet, NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { logout } from '../services/auth'
import './DashboardLayout.css'

export function DashboardLayout() {
  const { setAuthenticated } = useAuth()

  async function handleLogout() {
    setAuthenticated(false)
    await logout()
  }

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-logo">◉</span>
          <span>Painel Clínica</span>
        </div>
        <nav className="sidebar-nav">
          <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} end>
            Agendamentos
          </NavLink>
        </nav>
        <div className="sidebar-footer">
          <button type="button" className="btn-logout" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  )
}
