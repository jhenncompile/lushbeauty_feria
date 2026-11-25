import { ROUTES } from '../../../shared/layout'
import type { Role } from '../types'

/** Pantalla de inicio de cada rol tras ingresar. */
export function homeRouteFor(role: Role): string {
  switch (role) {
    case 'administradora':
      return ROUTES.home
    case 'especialista':
      return ROUTES.register
    case 'lector':
      return ROUTES.webPanel
  }
}

export function canAccess(role: Role, allowed: readonly Role[]): boolean {
  return allowed.includes(role)
}
