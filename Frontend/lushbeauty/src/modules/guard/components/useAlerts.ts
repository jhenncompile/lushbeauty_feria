import { useState } from 'react'
import { countPending, markReviewed } from '../domain/alerts'
import { ALERTS } from '../fixtures'

export function useAlerts() {
  const [alerts, setAlerts] = useState(ALERTS)
  return {
    alerts,
    pending: countPending(alerts),
    reviewed: alerts.length - countPending(alerts),
    review: (id: string) => setAlerts((current) => markReviewed(current, id, 'Marisol')),
  }
}
