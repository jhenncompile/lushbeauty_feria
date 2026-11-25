export { LoginPage } from './pages/LoginPage'
export { RequireRole } from './RequireRole'
export { SessionProvider } from './SessionProvider'
export { useSession } from './session'
export { homeRouteFor } from './domain/access'
export type { Role, Session, Specialist } from './types'
import { SPECIALISTS } from './fixtures'
import type { Specialist } from './types'

/** Contrato público: especialistas del salón (fixture hasta tener API). */
export function listSpecialists(): Specialist[] {
  return SPECIALISTS
}
