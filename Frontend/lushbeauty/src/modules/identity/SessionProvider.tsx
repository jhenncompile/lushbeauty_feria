import { useState } from 'react'
import type { ReactNode } from 'react'
import { SessionContext } from './session'
import type { SessionApi } from './session'
import type { Session } from './types'

/**
 * Sesión en memoria. En esta fase el rol lo elige la pantalla de ingreso (simulado);
 * con el backend (F00-T2) vendrá del servidor. No se guardan credenciales.
 */
export function SessionProvider({ children, initial = null }: { children: ReactNode; initial?: Session | null }) {
  const [session, setSession] = useState<Session | null>(initial)
  const api: SessionApi = { session, signIn: setSession, signOut: () => setSession(null) }
  return <SessionContext value={api}>{children}</SessionContext>
}
