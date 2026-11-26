import type { Role, Session } from '../types'

interface LoginResponse {
  token: string
  usuario: { nombre: string; roles: string[] }
}

export class LoginError extends Error {
  readonly kind: 'credentials' | 'network'
  constructor(kind: 'credentials' | 'network', message: string) {
    super(message)
    this.kind = kind
  }
}

const ROLE_BY_CODE: Record<string, Role> = {
  ADMINISTRADORA: 'administradora',
  ESPECIALISTA: 'especialista',
  LECTOR: 'lector',
}
// Si una persona tiene varios roles, se usa el de mayor alcance.
const ROLE_PRIORITY: Role[] = ['administradora', 'especialista', 'lector']

export function roleFromCodes(codes: readonly string[]): Role | null {
  const roles = codes.map((code) => ROLE_BY_CODE[code]).filter((role): role is Role => Boolean(role))
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? null
}

/** Ingresa contra `POST /api/auth/login`. El token queda solo en memoria. */
export async function login(email: string, password: string): Promise<Session> {
  let response: Response
  try {
    response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  } catch {
    throw new LoginError('network', 'No hay conexión con el servidor. Intente de nuevo.')
  }
  if (response.status === 401) throw new LoginError('credentials', 'Usuario o contraseña incorrectos.')
  if (!response.ok) throw new LoginError('network', 'El servidor no pudo atender el ingreso. Intente más tarde.')
  const data = (await response.json()) as LoginResponse
  const role = roleFromCodes(data.usuario.roles)
  if (!role) throw new LoginError('credentials', 'Su cuenta no tiene un rol asignado. Consulte a la administradora.')
  return { userName: data.usuario.nombre, role, token: data.token }
}
