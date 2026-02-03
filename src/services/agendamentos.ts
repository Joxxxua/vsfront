import { api } from '../lib/api'
import type { Agendamento } from '../types'

export async function listarAgendamentos(): Promise<Agendamento[]> {
  const data = await api.get<Agendamento[] | { data: Agendamento[] }>('/agendamentos')
  if (Array.isArray(data)) return data
  return (data as { data: Agendamento[] }).data ?? []
}

export async function confirmarAgendamento(id: string): Promise<Agendamento> {
  return api.patch<Agendamento>(`/agendamentos/${id}/confirmar`)
}

export async function cancelarAgendamento(id: string): Promise<Agendamento> {
  return api.patch<Agendamento>(`/agendamentos/${id}/cancelar`)
}
