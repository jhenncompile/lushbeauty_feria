import { useState } from 'react'
import type { ReactNode } from 'react'
import { SessionContext } from './session'
import type { SessionApi } from './session'
import type { Session } from './types'

/**
 * Sesión en memoria: el rol y el token vienen del servidor (`/api/auth/login`).
 * No se guardan credenciales ni el token en el almacenamiento del navegador.
 */
export function SessionProvider({ children, initial = null }: { children: ReactNode; initial?: Session | null }) {
  const [session, setSession] = useState<Session | null>(initial)
  const api: SessionApi = { session, signIn: setSession, signOut: () => setSession(null) }
  return <SessionContext value={api}>{children}</SessionContext>
}
