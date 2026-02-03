export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  refresh_token?: string
}

export type StatusAgendamento = 'AGENDADO' | 'CONFIRMADO' | 'CANCELADO' | 'REALIZADO'

export interface UsuarioResumo {
  id?: string
  nome?: string
  name?: string
  email?: string
  phone?: string
  cpf?: string
  [key: string]: unknown
}

export interface MedicoResumo {
  id?: string
  nome?: string
  name?: string
  especialidade?: string
  crm?: string
  user?: UsuarioResumo | null
  [key: string]: unknown
}

export interface ClinicaResumo {
  id?: string
  nome?: string
  name?: string
  [key: string]: unknown
}

export interface TipoAgendamentoResumo {
  id?: string
  nome?: string
  name?: string
  descricao?: string
  [key: string]: unknown
}

export interface Agendamento {
  id: string
  data: string
  status: StatusAgendamento
  user?: UsuarioResumo | string | null
  medico?: MedicoResumo | string | null
  clinica?: ClinicaResumo | string | null
  tipo?: TipoAgendamentoResumo | string | null
  created_at?: string
  updated_at?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: unknown
}

export interface ListarAgendamentosParams {
  status?: StatusAgendamento
  dataInicio?: string
  dataFim?: string
  medicoId?: string
  clinicaId?: string
}
