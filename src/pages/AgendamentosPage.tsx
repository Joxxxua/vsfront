import { useState, useEffect } from 'react'
import { listarAgendamentos, confirmarAgendamento, cancelarAgendamento, realizarAgendamento } from '../services/agendamentos'
import type {
  Agendamento,
  StatusAgendamento,
  ListarAgendamentosParams,
  UsuarioResumo,
  MedicoResumo,
  ClinicaResumo,
  TipoAgendamentoResumo,
} from '../types'

function especialidadesFromAgendamentos(agendamentos: Agendamento[]): string[] {
  const set = new Set<string>()
  for (const a of agendamentos) {
    const medico = a.medico
    if (!medico || typeof medico !== 'object') continue
    const esp = (medico as MedicoResumo).especialidade
    if (esp && String(esp).trim()) set.add(String(esp).trim())
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'))
}
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

const DAY_NAMES = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const HOURS_START = 7
const HOURS_END = 21

function getWeekStart(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const monthShort = (x: Date) => x.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
  return `${weekStart.getDate()} de ${monthShort(weekStart)} - ${end.getDate()} de ${monthShort(end)}`
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

type ViewMode = 'lista' | 'semanal'

export function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filtroStatus, setFiltroStatus] = useState<'' | StatusAgendamento>('')
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [filtroEspecialidade, setFiltroEspecialidade] = useState<string>('')
  const [viewMode, setViewMode] = useState<ViewMode>('lista')
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const [agendamentoDetalhe, setAgendamentoDetalhe] = useState<Agendamento | null>(null)

  const especialidades = especialidadesFromAgendamentos(agendamentos)

  const filtros: ListarAgendamentosParams = {}
  if (filtroStatus) filtros.status = filtroStatus
  if (filtroDataInicio) filtros.dataInicio = filtroDataInicio
  if (filtroDataFim) filtros.dataFim = filtroDataFim
  if (filtroEspecialidade) filtros.especialidade = filtroEspecialidade

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
    setFiltroEspecialidade('')
    load()
  }

  function goToToday() {
    setWeekStart(getWeekStart(new Date()))
  }

  function goToPrevWeek() {
    const next = new Date(weekStart)
    next.setDate(next.getDate() - 7)
    setWeekStart(next)
  }

  function goToNextWeek() {
    const next = new Date(weekStart)
    next.setDate(next.getDate() + 7)
    setWeekStart(next)
  }

  const agendamentosFiltrados = filtroEspecialidade
    ? agendamentos.filter((a) => {
        const medico = a.medico
        if (!medico || typeof medico !== 'object') return false
        const esp = (medico as MedicoResumo).especialidade
        return esp && String(esp).trim() === filtroEspecialidade
      })
    : agendamentos

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  const agendamentosSemana = agendamentosFiltrados.filter((a) => {
    const d = new Date(a.data)
    return d >= weekStart && d < weekEnd
  })
  const today = new Date()
  today.setHours(0, 0, 0, 0)

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

  async function handleRealizar(id: string) {
    setActionLoading(id)
    setError('')
    setSuccess('')
    try {
      await realizarAgendamento(id)
      setSuccess('Agendamento marcado como realizado.')
      await reloadList()
    } catch (err) {
      setError(
        getApiErrorMessage(err, 'Erro inesperado. Tente novamente.', {
          forbidden: 'Você não tem permissão para este recurso.',
          validation: 'Só é possível marcar como realizado após a data do agendamento.',
        })
      )
    } finally {
      setActionLoading(null)
    }
  }

  const podeConfirmar = (status: StatusAgendamento) => status === 'AGENDADO'
  const podeCancelar = (status: StatusAgendamento) =>
    status === 'AGENDADO' || status === 'CONFIRMADO'
  const podeRealizar = (status: StatusAgendamento, data: string) =>
    status === 'CONFIRMADO' && new Date(data) <= new Date()

  const proximoAgendamento = agendamentosFiltrados
    .slice()
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
    .find((agendamento) => new Date(agendamento.data).getTime() >= Date.now()) ?? agendamentosFiltrados[0]

  return (
    <div className="agendamentos-page">
      <header className="agendamentos-hero">
        <div className="hero-content">
          <h1 className="hero-title">Agendamentos</h1>
          <p className="hero-subtitle">
            Acompanhe os atendimentos, confirme horários e mantenha a clínica organizada.
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
                <span className={`highlight-badge status-${proximoAgendamento.status}`}>
                  {statusLabel[proximoAgendamento.status] ?? proximoAgendamento.status}
                </span>
              </div>
            </div>
          </aside>
        ) : null}
      </header>

      <section className="agendamentos-sugestoes">
        <div className="categorias">
          <button
            type="button"
            className={`categoria-chip${!filtroEspecialidade ? ' active' : ''}`}
            onClick={() => setFiltroEspecialidade('')}
          >
            Todos
          </button>
          {especialidades.map((esp) => (
            <button
              key={esp}
              type="button"
              className={`categoria-chip${filtroEspecialidade === esp ? ' active' : ''}`}
              onClick={() => setFiltroEspecialidade(esp)}
            >
              {esp}
            </button>
          ))}
        </div>
        <div className="view-toggle">
          <button
            type="button"
            className={`view-toggle-btn${viewMode === 'lista' ? ' active' : ''}`}
            onClick={() => setViewMode('lista')}
          >
            Lista
          </button>
          <button
            type="button"
            className={`view-toggle-btn${viewMode === 'semanal' ? ' active' : ''}`}
            onClick={() => setViewMode('semanal')}
          >
            Agenda Semanal
          </button>
        </div>
      </section>

      <section className="agendamentos-filtros">
        <div className="filtros-inner">
          <div className="campo">
            <label htmlFor="filtro-status">Status</label>
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
            <button type="button" className="btn-secondary" onClick={handleLimpar} disabled={loading}>
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
      ) : viewMode === 'semanal' ? (
        <>
          <section className="agenda-semanal-header">
            <h2 className="agenda-semanal-title">Agenda Semanal</h2>
            <button type="button" className="agenda-btn-hoje" onClick={goToToday}>
              Hoje
            </button>
            <div className="agenda-week-nav">
              <button type="button" className="agenda-nav-btn" onClick={goToPrevWeek} aria-label="Semana anterior">
                ‹
              </button>
              <span className="agenda-week-range">{formatWeekRange(weekStart)}</span>
              <button type="button" className="agenda-nav-btn" onClick={goToNextWeek} aria-label="Próxima semana">
                ›
              </button>
            </div>
            <div className="agenda-view-label">Semanal</div>
            <button type="button" className="agenda-btn-novo">
              + Novo Agendamento
            </button>
          </section>
          <section className="agenda-semanal-grid-wrap">
            <div className="agenda-semanal-grid">
              <div className="agenda-time-col">
                <div className="agenda-corner" />
                {Array.from({ length: HOURS_END - HOURS_START }, (_, i) => (
                  <div key={i} className="agenda-time-slot">
                    {String(HOURS_START + i).padStart(2, '0')}:00
                  </div>
                ))}
              </div>
              <div className="agenda-days-col">
                {Array.from({ length: 7 }, (_, dayIndex) => {
                  const d = new Date(weekStart)
                  d.setDate(d.getDate() + dayIndex)
                  const isToday = isSameDay(d, today)
                  return (
                    <div key={dayIndex} className="agenda-day-col">
                      <div className={`agenda-day-header${isToday ? ' is-today' : ''}`}>
                        <span className="agenda-day-name">{DAY_NAMES[dayIndex]}</span>
                        <span className="agenda-day-num">{d.getDate()}</span>
                      </div>
                      {Array.from({ length: HOURS_END - HOURS_START }, (_, hourIndex) => (
                        <div key={hourIndex} className="agenda-cell" />
                      ))}
                    </div>
                  )
                })}
              </div>
              <div className="agenda-blocks-layer">
                {agendamentosSemana.map((agendamento) => {
                  const d = new Date(agendamento.data)
                  const dayIndex = (d.getDay() + 7) % 7
                  const hours = d.getHours() + d.getMinutes() / 60
                  const slotIndex = hours - HOURS_START
                  if (slotIndex < 0 || slotIndex >= HOURS_END - HOURS_START) return null
                  const duration = 1
                  const top = (slotIndex / (HOURS_END - HOURS_START)) * 100
                  const height = (duration / (HOURS_END - HOURS_START)) * 100
                  const endHour = d.getHours() + duration
                  const endMin = d.getMinutes()
                  const endStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`
                  const startStr = formatHour(agendamento.data)
                  return (
                    <div
                      key={agendamento.id}
                      role="button"
                      tabIndex={0}
                      className={`agenda-block status-${agendamento.status}`}
                      style={{
                        left: `${(100 * dayIndex) / 7}%`,
                        width: `${100 / 7}%`,
                        top: `${top}%`,
                        height: `${height}%`,
                      }}
                      title={`${displayName(agendamento.user)} • ${displayName(agendamento.medico)} — Clique para ver detalhes`}
                      onClick={() => setAgendamentoDetalhe(agendamento)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setAgendamentoDetalhe(agendamento)
                        }
                      }}
                    >
                      <span className="agenda-block-name">{displayName(agendamento.user)}</span>
                      <span className="agenda-block-time">{startStr} - {endStr}</span>
                      <span className="agenda-block-prof">{displayName(agendamento.medico)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        </>
      ) : agendamentos.length === 0 && !error ? (
        <p className="agendamentos-empty">Nenhum agendamento encontrado.</p>
      ) : agendamentosFiltrados.length === 0 ? (
        <p className="agendamentos-empty">Nenhum agendamento para a especialidade selecionada.</p>
      ) : (
        <section className="agendamentos-grid">
          {agendamentosFiltrados.map((agendamento) => (
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
              {(podeConfirmar(agendamento.status) || podeCancelar(agendamento.status) || podeRealizar(agendamento.status, agendamento.data)) && (
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
                  {podeRealizar(agendamento.status, agendamento.data) && (
                    <button
                      type="button"
                      className="btn-realizar"
                      onClick={() => handleRealizar(agendamento.id)}
                      disabled={actionLoading !== null}
                    >
                      {actionLoading === agendamento.id ? 'Realizando…' : 'Realizar'}
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

      {agendamentoDetalhe && (
        <div
          className="agenda-detalhe-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="agenda-detalhe-title"
          onClick={() => setAgendamentoDetalhe(null)}
        >
          <div className="agenda-detalhe-modal" onClick={(e) => e.stopPropagation()}>
            <h2 id="agenda-detalhe-title">Detalhes do agendamento</h2>
            <div className="agenda-detalhe-body">
              <p>
                <strong>Paciente</strong>
                <span className="agenda-detalhe-value">{displayName(agendamentoDetalhe.user)}</span>
              </p>
              <p>
                <strong>Médico</strong>
                <span className="agenda-detalhe-value">{displayName(agendamentoDetalhe.medico)}</span>
              </p>
              <p>
                <strong>Data e horário</strong>
                <span className="agenda-detalhe-value">{formatDay(agendamentoDetalhe.data)} às {formatHour(agendamentoDetalhe.data)}</span>
              </p>
              <p>
                <strong>Status</strong>
                <span className={`agenda-detalhe-status status-${agendamentoDetalhe.status}`}>
                  {statusLabel[agendamentoDetalhe.status] ?? agendamentoDetalhe.status}
                </span>
              </p>
              <p>
                <strong>Tipo</strong>
                <span className="agenda-detalhe-value">{formatTipo(agendamentoDetalhe.tipo)}</span>
              </p>
            </div>
            <div className="agenda-detalhe-actions">
              {podeConfirmar(agendamentoDetalhe.status) && (
                <button
                  type="button"
                  className="btn-confirmar"
                  disabled={actionLoading !== null}
                  onClick={async () => {
                    try {
                      await handleConfirmar(agendamentoDetalhe.id)
                      setAgendamentoDetalhe(null)
                    } catch {
                      /* erro já exibido na página */
                    }
                  }}
                >
                  {actionLoading === agendamentoDetalhe.id ? 'Confirmando…' : 'Confirmar'}
                </button>
              )}
              {podeRealizar(agendamentoDetalhe.status, agendamentoDetalhe.data) && (
                <button
                  type="button"
                  className="btn-realizar"
                  disabled={actionLoading !== null}
                  onClick={async () => {
                    try {
                      await handleRealizar(agendamentoDetalhe.id)
                      setAgendamentoDetalhe(null)
                    } catch {
                      /* erro já exibido na página */
                    }
                  }}
                >
                  {actionLoading === agendamentoDetalhe.id ? 'Realizando…' : 'Realizar'}
                </button>
              )}
              {podeCancelar(agendamentoDetalhe.status) && (
                <button
                  type="button"
                  className="btn-cancelar"
                  disabled={actionLoading !== null}
                  onClick={async () => {
                    try {
                      await handleCancelar(agendamentoDetalhe.id)
                      setAgendamentoDetalhe(null)
                    } catch {
                      /* erro já exibido na página */
                    }
                  }}
                >
                  {actionLoading === agendamentoDetalhe.id ? 'Cancelando…' : 'Cancelar'}
                </button>
              )}
              <button type="button" className="agenda-detalhe-fechar" onClick={() => setAgendamentoDetalhe(null)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
