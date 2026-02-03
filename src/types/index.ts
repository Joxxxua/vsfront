export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token?: string
}

export type StatusAgendamento = 'pendente' | 'confirmado' | 'cancelado'

export interface Agendamento {
  id: string
  data: string
  horario: string
  paciente?: string
  status: StatusAgendamento
  [key: string]: unknown
}
