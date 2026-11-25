import { createContext, useContext } from 'react'
import type { NewQueueItem, QueueItem } from './types'

export interface OfflineApi {
  online: boolean
  queue: QueueItem[]
  /** Guarda el registro: queda «pendiente» sin conexión y «confirmada» con ella. */
  enqueue: (item: NewQueueItem) => void
  /** Confirma el importe de un registro en revisión para que se reenvíe. */
  confirmReview: (id: string) => void
  /** Intenta enviar lo pendiente. «offline» si todavía no hay conexión. */
  retry: () => 'sent' | 'offline'
  /** Solo para demos y pruebas de campo: fuerza el estado de conexión. */
  simulateOnline: (online: boolean) => void
}

const NOOP: OfflineApi = {
  online: true,
  queue: [],
  enqueue: () => {},
  confirmReview: () => {},
  retry: () => 'sent',
  simulateOnline: () => {},
}

export const OfflineContext = createContext<OfflineApi>(NOOP)

export function useOfflineQueue(): OfflineApi {
  return useContext(OfflineContext)
}
