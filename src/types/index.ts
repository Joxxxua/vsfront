export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token?: string
}

export type StatusAgendamento = 'AGENDADO' | 'CONFIRMADO' | 'CANCELADO' | 'REALIZADO'

export interface Agendamento {
  id: string
  data: string
  status: StatusAgendamento
  user?: { name?: string; [key: string]: unknown } | string
  medico?: { name?: string; [key: string]: unknown } | string
  clinica?: { name?: string; [key: string]: unknown } | string
  tipo?: string
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface ListarAgendamentosParams {
  status?: StatusAgendamento
  dataInicio?: string
  dataFim?: string
  medicoId?: string
  clinicaId?: string
}
