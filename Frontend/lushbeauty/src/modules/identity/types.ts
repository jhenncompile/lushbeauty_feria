export type Role = 'administradora' | 'especialista' | 'lector'

export interface Session {
  userName: string
  role: Role
}
