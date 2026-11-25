export type QueueStatus = 'pendiente' | 'confirmada' | 'revision'

export interface QueueItem {
  /** Clave única del registro: reintentar nunca lo duplica (RN-01). */
  id: string
  label: string
  timeLabel: string
  amountCents: number
  status: QueueStatus
  error?: string
}

export interface NewQueueItem {
  id: string
  label: string
  amountCents: number
}
