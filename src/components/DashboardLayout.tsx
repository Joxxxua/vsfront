import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { logout } from '../services/auth'
import './DashboardLayout.css'
import logoImg from '../assets/ChatGPT_Image_6_de_fev._de_2026__23_17_35-removebg-preview.png' 

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
          <nav className="dashboard-nav">
            {/* Seus NavLinks viriam aqui */}
          </nav>
        </div>

        <div className="header-right">
          <div className="location-tag">
            <span className="location-dot" />
            <span className="location-text">
              Painel • {location.pathname === '/' ? 'Agendamentos' : ''}
            </span>
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