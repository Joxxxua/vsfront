import { useState, useEffect } from 'react'
import {
  listarAgendamentos,
  confirmarAgendamento,
  cancelarAgendamento,
} from '../services/agendamentos'
import type { Agendamento, StatusAgendamento, ListarAgendamentosParams } from '../types'
import { ApiError } from '../lib/api'
import './AgendamentosPage.css'

const statusLabel: Record<StatusAgendamento, string> = {
  AGENDADO: 'Agendado',
  CONFIRMADO: 'Confirmado',
  CANCELADO: 'Cancelado',
  REALIZADO: 'Realizado',
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
  field: Agendamento['user'] | Agendamento['medico'] | Agendamento['clinica']
): string {
  if (field == null) return '–'
  if (typeof field === 'string') return field
  if (typeof field === 'object' && field !== null && 'name' in field) {
    return String((field as { name?: string }).name ?? '–')
  }
  return '–'
}

export function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
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
    if (withLoading) setLoading(true)
    try {
      const list = await listarAgendamentos(
        Object.keys(filtros).length > 0 ? filtros : undefined
      )
      setAgendamentos(list)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? (err.status === 403 ? 'Sem permissão para este recurso.' : err.message)
          : 'Não foi possível carregar os agendamentos.'
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
  }, [filtroStatus, filtroDataInicio, filtroDataFim])

  async function handleConfirmar(id: string) {
    setActionLoading(id)
    setError('')
    try {
      await confirmarAgendamento(id)
      await reloadList()
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 403
          ? 'Sem permissão para confirmar este agendamento.'
          : 'Falha ao confirmar agendamento.'
      )
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCancelar(id: string) {
    setActionLoading(id)
    setError('')
    try {
      await cancelarAgendamento(id)
      await reloadList()
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 403
          ? 'Sem permissão para cancelar este agendamento.'
          : 'Falha ao cancelar agendamento.'
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
          Status
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
          Data início (YYYY-MM-DD)
          <input
            type="date"
            value={filtroDataInicio}
            onChange={(e) => setFiltroDataInicio(e.target.value)}
          />
        </label>
        <label>
          Data fim (YYYY-MM-DD)
          <input
            type="date"
            value={filtroDataFim}
            onChange={(e) => setFiltroDataFim(e.target.value)}
          />
        </label>
      </div>

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
                  <td>{a.tipo ?? '–'}</td>
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
