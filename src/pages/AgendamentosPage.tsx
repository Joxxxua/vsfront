import { useState, useEffect } from 'react'
import { listarAgendamentos, confirmarAgendamento, cancelarAgendamento } from '../services/agendamentos'
import type {
  Agendamento,
  StatusAgendamento,
  ListarAgendamentosParams,
  UsuarioResumo,
  MedicoResumo,
  ClinicaResumo,
  TipoAgendamentoResumo,
} from '../types'
import { getApiErrorMessage } from '../lib/api'
import './AgendamentosPage.css'

const statusLabel: Record<StatusAgendamento, string> = {
  AGENDADO: 'Agendado',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  REALIZADO: 'Realizado',
}

const tipoLabel: Record<string, string> = {
  EXAME: 'Exame',
  CIRURGIA: 'Cirurgia',
  CONSULTA: 'Consulta',
}

const STATUS_OPTIONS: { value: '' | StatusAgendamento; label: string }[] = [
  { value: '', label: 'Todos' },
  ...Object.entries(statusLabel).map(([value, label]) => ({
    value: value as StatusAgendamento,
    label,
  })),
]

const categoriasSugestoes = [
  { label: 'Consultas', icon: '🩺' },
  { label: 'Exames', icon: '🧪' },
  { label: 'Cardiologia', icon: '❤️' },
  { label: 'Pneumologia', icon: '🫁' },
  { label: 'Fisioterapia', icon: '🦵' },
]

const destaques = [
  {
    titulo: 'Use a tecnologia a favor da sua clínica',
    descricao: 'Acompanhe confirmações e cancelamentos em tempo real.',
  },
  {
    titulo: 'Organize sua equipe com antecedência',
    descricao: 'Visualize rapidamente todos os atendimentos pendentes.',
  },
]

function formatDate(value: string, options: Intl.DateTimeFormatOptions): string {
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString('pt-BR', options)
  } catch {
    return '—'
  }
}

function formatDay(value: string): string {
  return formatDate(value, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
}

function formatHour(value: string): string {
  return formatDate(value, { hour: '2-digit', minute: '2-digit' })
}

function displayName(field: UsuarioResumo | MedicoResumo | ClinicaResumo | string | null | undefined): string {
  if (!field) return '–'
  if (typeof field === 'string') return field
  if ('nome' in field && field.nome) return String(field.nome)
  if ('name' in field && field.name) return String(field.name)
  if ('user' in field && field.user) {
    const user = field.user as UsuarioResumo | null
    if (user?.nome) return String(user.nome)
    if (user?.name) return String(user.name)
    if (user?.email) return String(user.email)
  }
  if ('email' in field && field.email) return String(field.email)
  return '–'
}

function formatTipo(tipo: TipoAgendamentoResumo | string | null | undefined): string {
  if (!tipo) return '–'
  if (typeof tipo === 'string') {
    const key = tipo.toUpperCase() as keyof typeof tipoLabel
    return tipoLabel[key] ?? tipo
  }
  if (typeof tipo === 'object') {
    const nome = tipo.nome ?? tipo.name
    if (!nome) return '–'
    const key = nome.toUpperCase() as keyof typeof tipoLabel
    return tipoLabel[key] ?? nome
  }
  return '–'
}

export function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<'' | StatusAgendamento>('')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')

  const filtros: ListarAgendamentosParams = {}
  if (filtroStatus) filtros.status = filtroStatus
  if (filtroDataInicio) filtros.dataInicio = filtroDataInicio
  if (filtroDataFim) filtros.dataFim = filtroDataFim

  async function fetchList(withLoading: boolean) {
    setError('')
    setSuccess('')
    if (withLoading) setLoading(true)
    try {
      const list = await listarAgendamentos(
        Object.keys(filtros).length > 0 ? filtros : undefined
      )
      setAgendamentos(list)
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Erro ao carregar agendamentos.', {
          forbidden: 'Você não tem permissão para este recurso.',
          validation: 'Parâmetros inválidos. Verifique os filtros.',
        })
      )
    } finally {
      if (withLoading) setLoading(false)
    }
  }

  async function load() {
    await fetchList(true)
  }

  async function reloadList() {
    await fetchList(false)
  }

  useEffect(() => {
    load()
  }, [])

  function handleBuscar() {
    load()
  }

  function handleLimpar() {
    setFiltroStatus('')
    setFiltroDataInicio('')
    setFiltroDataFim('')
    load()
  }

  async function handleConfirmar(id: string) {
    setActionLoading(id)
    setError('')
    setSuccess('')
    try {
      await confirmarAgendamento(id)
      setSuccess('Agendamento confirmado.')
      await reloadList()
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Erro inesperado. Tente novamente.', {
          forbidden: 'Você não tem permissão para este recurso.',
        })
      )
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCancelar(id: string) {
    setActionLoading(id)
    setError('')
    setSuccess('')
    try {
      await cancelarAgendamento(id)
      setSuccess('Agendamento cancelado.')
      await reloadList()
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Erro inesperado. Tente novamente.', {
          forbidden: 'Você não tem permissão para este recurso.',
        })
      )
    } finally {
      setActionLoading(null)
    }
  }

  const podeConfirmar = (status: StatusAgendamento) => status === 'AGENDADO'
  const podeCancelar = (status: StatusAgendamento) =>
    status === 'AGENDADO' || status === 'CONFIRMADO'

  const proximoAgendamento = agendamentos
    .slice()
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .find((agendamento) => new Date(agendamento.data).getTime() >= Date.now()) ?? agendamentos[0]

  return (
    <div className="agendamentos-page">
      <header className="agendamentos-hero">
        <div className="hero-content">
          <span className="hero-greeting">Bom dia, administrador!</span>
          <h1 className="hero-title">
            Bem-vindo ao seu painel <span>saúde+</span>
          </h1>
          <p className="hero-subtitle">
            Acompanhe os atendimentos do dia, confirme horários e mantenha sua clínica organizada.
          </p>
        </div>
        {proximoAgendamento ? (
          <aside className="hero-highlight">
            <h2>Próximo atendimento</h2>
            <div className="highlight-body">
              <div className="highlight-date">
                <span>{formatDay(proximoAgendamento.data)}</span>
                <strong>{formatHour(proximoAgendamento.data)}</strong>
              </div>
              <div className="highlight-info">
                <span className="highlight-label">Profissional</span>
                <strong>{displayName(proximoAgendamento.medico)}</strong>
                <span className="highlight-label">Paciente</span>
                <strong>{displayName(proximoAgendamento.user)}</strong>
                <div className={`highlight-badge status-${proximoAgendamento.status}`}>
                  {statusLabel[proximoAgendamento.status] ?? proximoAgendamento.status}
                </div>
              </div>
            </div>
          </aside>
        ) : null}
      </header>

      <section className="agendamentos-sugestoes">
        <div className="categorias">
          {categoriasSugestoes.map((categoria) => (
            <button key={categoria.label} type="button" className="categoria-chip">
              <span aria-hidden>{categoria.icon}</span>
              {categoria.label}
            </button>
          ))}
        </div>
        <div className="destaques">
          {destaques.map((item) => (
            <article key={item.titulo} className="destaque-card">
              <h3>{item.titulo}</h3>
              <p>{item.descricao}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="agendamentos-filtros">
        <div className="filtros-inner">
          <div className="campo">
            <label htmlFor="filtro-status">Filtrar por status</label>
            <select
              id="filtro-status"
              value={filtroStatus}
              onChange={(e) => setFiltroStatus((e.target.value || '') as '' | StatusAgendamento)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value || 'todos'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="campo">
            <label htmlFor="filtro-inicio">Data inicial</label>
            <input id="filtro-inicio" type="date" value={filtroDataInicio} onChange={(e) => setFiltroDataInicio(e.target.value)} />
          </div>
          <div className="campo">
            <label htmlFor="filtro-fim">Data final</label>
            <input id="filtro-fim" type="date" value={filtroDataFim} onChange={(e) => setFiltroDataFim(e.target.value)} />
          </div>
          <div className="filtros-botoes">
            <button type="button" onClick={handleBuscar} disabled={loading}>
              Buscar
            </button>
            <button type="button" onClick={handleLimpar} disabled={loading}>
              Limpar
            </button>
          </div>
        </div>
      </section>

      {success && (
        <div className="agendamentos-success" role="status">
          {success}
        </div>
      )}

      {error && (
        <div className="agendamentos-error" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="agendamentos-loading">Carregando agendamentos…</div>
      ) : agendamentos.length === 0 && !error ? (
        <p className="agendamentos-empty">Nenhum agendamento encontrado.</p>
      ) : (
        <section className="agendamentos-grid">
          {agendamentos.map((agendamento) => (
            <article key={agendamento.id} className={`agendamento-card status-${agendamento.status}`}>
              <header className="agendamento-card-header">
                <div>
                  <span className="card-date">{formatDay(agendamento.data)}</span>
                  <strong className="card-hour">{formatHour(agendamento.data)}</strong>
                </div>
                <span className={`status-chip status-${agendamento.status}`}>
                  {statusLabel[agendamento.status] ?? agendamento.status}
                </span>
              </header>
              <div className="agendamento-card-body">
                <div className="card-row">
                  <span className="label">Paciente</span>
                  <strong>{displayName(agendamento.user)}</strong>
                </div>
                <div className="card-row">
                  <span className="label">Profissional</span>
                  <strong>{displayName(agendamento.medico)}</strong>
                </div>
                <div className="card-row">
                  <span className="label">Tipo</span>
                  <strong>{formatTipo(agendamento.tipo)}</strong>
                </div>
              </div>
              {(podeConfirmar(agendamento.status) || podeCancelar(agendamento.status)) && (
                <footer className="agendamento-card-footer">
                  {podeConfirmar(agendamento.status) && (
                    <button
                      type="button"
                      className="btn-confirmar"
                      onClick={() => handleConfirmar(agendamento.id)}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === agendamento.id ? 'Confirmando…' : 'Confirmar'}
                    </button>
                  )}
                  {podeCancelar(agendamento.status) && (
                    <button
                      type="button"
                      className="btn-cancelar"
                      onClick={() => handleCancelar(agendamento.id)}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === agendamento.id ? 'Cancelando…' : 'Cancelar'}
                    </button>
                  )}
                </footer>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  )
}
