import { useState, useEffect } from 'react'
import {
  listarAgendamentos,
  confirmarAgendamento,
  cancelarAgendamento,
} from '../services/agendamentos'
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
  ...(Object.entries(statusLabel).map(([value, label]) => ({
    value: value as StatusAgendamento,
    label,
  }))),
]

function formatDateTime(value: string): string {
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return value
  }
}

function displayName(
  field: UsuarioResumo | MedicoResumo | ClinicaResumo | string | null | undefined
): string {
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

  if (loading) {
    return (
      <div className="agendamentos-page">
        <div className="agendamentos-loading">Carregando agendamentos…</div>
      </div>
    )
  }

  return (
    <div className="agendamentos-page">
      <header className="agendamentos-header">
        <h1>Agendamentos</h1>
      </header>

      <div className="agendamentos-filtros">
        <label>
          Filtrar por status
          <select
            value={filtroStatus}
            onChange={(e) =>
              setFiltroStatus((e.target.value || '') as '' | StatusAgendamento)
            }
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'todos'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Data inicial
          <input
            type="date"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
          />
        </label>
        <label>
          Data final
          <input
            type="date"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
          />
        </label>
        <div className="agendamentos-filtros-actions">
          <button type="button" onClick={handleBuscar} disabled={loading}>
            Buscar
          </button>
          <button type="button" onClick={handleLimpar} disabled={loading}>
            Limpar
          </button>
        </div>
      </div>

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

      {agendamentos.length === 0 && !error ? (
        <p className="agendamentos-empty">Nenhum agendamento encontrado.</p>
      ) : (
        <div className="agendamentos-table-wrap">
          <table className="agendamentos-table">
            <thead>
              <tr>
                <th>Data/Hora</th>
                <th>Paciente</th>
                <th>Médico</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((a) => (
                <tr key={a.id} data-status={a.status}>
                  <td>{formatDateTime(a.data)}</td>
                  <td>{displayName(a.user)}</td>
                  <td>{displayName(a.medico)}</td>
                  <td>{formatTipo(a.tipo)}</td>
                  <td>
                    <span className={`status-badge status-${a.status}`}>
                      {statusLabel[a.status] ?? a.status}
                    </span>
                  </td>
                  <td>
                    {(podeConfirmar(a.status) || podeCancelar(a.status)) && (
                      <div className="agendamentos-actions">
                        {podeConfirmar(a.status) && (
                          <button
                            type="button"
                            className="btn-confirmar"
                            onClick={() => handleConfirmar(a.id)}
                            disabled={actionLoading !== null}
                          >
                            {actionLoading === a.id ? '…' : 'Confirmar'}
                          </button>
                        )}
                        {podeCancelar(a.status) && (
                          <button
                            type="button"
                            className="btn-cancelar"
                            onClick={() => handleCancelar(a.id)}
                            disabled={actionLoading !== null}
                          >
                            {actionLoading === a.id ? '…' : 'Cancelar'}
                          </button>
                        )}
                      </div>
                    )}
                    {!podeConfirmar(a.status) && !podeCancelar(a.status) && '–'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
