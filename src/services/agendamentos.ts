import { api } from '../lib/api'
import type { Agendamento, ListarAgendamentosParams } from '../types'

function buildQuery(params: ListarAgendamentosParams): string {
  const search = new URLSearchParams()
  if (params.status != null) search.set('status', params.status)
  if (params.dataInicio != null) search.set('dataInicio', params.dataInicio)
  if (params.dataFim != null) search.set('dataFim', params.dataFim)
  if (params.medicoId != null) search.set('medicoId', params.medicoId)
  if (params.clinicaId != null) search.set('clinicaId', params.clinicaId)
  const q = search.toString()
  return q ? `?${q}` : ''
}

export async function listarAgendamentos(
  params?: ListarAgendamentosParams
): Promise<Agendamento[]> {
  const query = params ? buildQuery(params) : ''
  const data = await api.get<Agendamento[]>(`/agendamento${query}`)
  return Array.isArray(data) ? data : []
}

export async function getAgendamento(id: string): Promise<Agendamento> {
  return api.get<Agendamento>(`/agendamento/${id}`)
}

export async function confirmarAgendamento(id: string): Promise<Agendamento> {
  return api.patch<Agendamento>(`/agendamento/${id}/confirmar`, {})
}

export async function cancelarAgendamento(id: string): Promise<Agendamento> {
  return api.patch<Agendamento>(`/agendamento/${id}/cancelar`, {})
}
