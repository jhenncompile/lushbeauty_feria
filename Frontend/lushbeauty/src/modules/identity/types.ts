export type Role = 'administradora' | 'especialista' | 'lector'

export interface Session {
  userName: string
  role: Role
}

export interface Specialist {
  id: string
  name: string
}
