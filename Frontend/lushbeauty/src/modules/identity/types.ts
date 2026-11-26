export type Role = 'administradora' | 'especialista' | 'lector'

export interface Session {
  userName: string
  role: Role
  /** Token del servidor; solo en memoria. Ausente en sesiones de prueba. */
  token?: string
}

export interface Specialist {
  id: string
  name: string
}
