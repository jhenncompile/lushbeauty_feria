import { createContext, useContext } from 'react'

export interface ConnectionState {
  online: boolean
  pending: number
}

/** Estado de conexión compartido por los shells. El módulo `offline` lo alimenta. */
export const ConnectionContext = createContext<ConnectionState>({ online: true, pending: 0 })

export function useConnection(): ConnectionState {
  return useContext(ConnectionContext)
}
