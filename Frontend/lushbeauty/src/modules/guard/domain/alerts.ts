/** Alertas de Lush Guard: reglas simples con dato observado y umbral. Una alerta pide revisión; no acusa. */

export type AlertStatus = 'pending' | 'reviewed'

export interface GuardAlert {
  id: string
  rule: string
  observed: string
  threshold: string
  origin: string
  status: AlertStatus
  reviewedBy?: string
}

export function countPending(alerts: GuardAlert[]): number {
  return alerts.filter((alert) => alert.status === 'pending').length
}

/** Marca como revisada solo una alerta pendiente; la revisión conserva quién la hizo. */
export function markReviewed(alerts: GuardAlert[], id: string, by: string): GuardAlert[] {
  return alerts.map((alert) =>
    alert.id === id && alert.status === 'pending' ? { ...alert, status: 'reviewed', reviewedBy: by } : alert,
  )
}
