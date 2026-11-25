import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { ROUTES } from '../../shared/layout'
import { canAccess, homeRouteFor } from './domain/access'
import { useSession } from './session'
import type { Role } from './types'

interface RequireRoleProps {
  allow: readonly Role[]
  children: ReactNode
}

/** Sin sesión va al ingreso; con un rol no permitido, a la pantalla de inicio de su rol. */
export function RequireRole({ allow, children }: RequireRoleProps) {
  const { session } = useSession()
  if (!session) return <Navigate to={ROUTES.login} replace />
  if (!canAccess(session.role, allow)) return <Navigate to={homeRouteFor(session.role)} replace />
  return <>{children}</>
}
