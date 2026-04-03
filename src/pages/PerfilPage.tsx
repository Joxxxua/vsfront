import { Link } from 'react-router-dom'
import { getSessionUserDisplay } from '../lib/auth'
import './PerfilPage.css'

export function PerfilPage() {
  const { email, name, initials } = getSessionUserDisplay()

  return (
    <div className="perfil-page">
      <header className="perfil-header">
        <Link to="/" className="perfil-back">
          ← Voltar ao painel
        </Link>
        <h1 className="perfil-title">Meu perfil</h1>
        <p className="perfil-lead">Dados da sessão atual no painel da clínica.</p>
      </header>

      <section className="perfil-card" aria-labelledby="perfil-dados">
        <div className="perfil-avatar-large" aria-hidden="true">
          {initials}
        </div>
        <h2 id="perfil-dados" className="visually-hidden">
          Dados da conta
        </h2>
        <dl className="perfil-dl">
          {name ? (
            <div className="perfil-row">
              <dt>Nome</dt>
              <dd>{name}</dd>
            </div>
          ) : null}
          <div className="perfil-row">
            <dt>E-mail</dt>
            <dd>{email ?? '—'}</dd>
          </div>
        </dl>
        {!email && !name ? (
          <p className="perfil-hint">
            Faça login novamente para associar o e-mail a esta sessão.
          </p>
        ) : null}
      </section>
    </div>
  )
}
