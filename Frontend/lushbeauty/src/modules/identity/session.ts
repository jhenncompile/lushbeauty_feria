import { createContext, useContext } from 'react'
import type { Session } from './types'

export interface SessionApi {
  session: Session | null
  signIn: (session: Session) => void
  signOut: () => void
}

export const SessionContext = createContext<SessionApi | null>(null)

export function useSession(): SessionApi {
  const api = useContext(SessionContext)
  if (!api) throw new Error('useSession debe usarse dentro de SessionProvider')
  return api
}
