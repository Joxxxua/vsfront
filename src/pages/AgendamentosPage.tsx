import { useState, useEffect } from 'react'
import {
  listarAgendamentos,
  confirmarAgendamento,
  cancelarAgendamento,
} from '../services/agendamentos'
import type { Agendamento, StatusAgendamento } from '../types'
import { ApiError } from '../lib/api'
import './AgendamentosPage.css'

const statusLabel: Record<StatusAgendamento, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  cancelado: 'Cancelado',
}

function formatDate(value: string): string {
  try {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

export function AgendamentosPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  async function load() {
    setError('')
    setLoading(true)
    try {
      const list = await listarAgendamentos()
      setAgendamentos(list)
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Não foi possível carregar os agendamentos.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleConfirmar(id: string) {
    setActionLoading(id)
    try {
      const updated = await confirmarAgendamento(id)
      setAgendamentos((prev) =>
        prev.map((a) => (a.id === id ? updated : a))
      )
    } catch {
      setError('Falha ao confirmar agendamento.')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCancelar(id: string) {
    setActionLoading(id)
    try {
      const updated = await cancelarAgendamento(id)
      setAgendamentos((prev) =>
        prev.map((a) => (a.id === id ? updated : a))
      )
    } catch {
      setError('Falha ao cancelar agendamento.')
    } finally {
      setActionLoading(null)
    }
  }

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
                <th>Data</th>
                <th>Horário</th>
                <th>Paciente</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((a) => (
                <tr key={a.id} data-status={a.status}>
                  <td>{formatDate(a.data)}</td>
                  <td>{a.horario ?? '–'}</td>
                  <td>{a.paciente ?? '–'}</td>
                  <td>
                    <span className={`status-badge status-${a.status}`}>
                      {statusLabel[a.status] ?? a.status}
                    </span>
                  </td>
                  <td>
                    {a.status === 'pendente' && (
                      <div className="agendamentos-actions">
                        <button
                          type="button"
                          className="btn-confirmar"
                          onClick={() => handleConfirmar(a.id)}
                          disabled={actionLoading !== null}
                        >
                          {actionLoading === a.id ? '…' : 'Confirmar'}
                        </button>
                        <button
                          type="button"
                          className="btn-cancelar"
                          onClick={() => handleCancelar(a.id)}
                          disabled={actionLoading !== null}
                        >
                          {actionLoading === a.id ? '…' : 'Cancelar'}
                        </button>
                      </div>
                    )}
                    {a.status !== 'pendente' && '–'}
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
