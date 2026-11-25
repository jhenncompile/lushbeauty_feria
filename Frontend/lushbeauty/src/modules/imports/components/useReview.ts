import { useState } from 'react'
import { canConfirm, summarize } from '../domain/review'
import type { Decision } from '../domain/review'
import { REMAINING_ITEMS, REVIEW_ITEMS } from '../fixtures'

/** Estado de la revisión: decisiones por fila, filas visibles y motivo elegido en los descuentos sin motivo. */
export function useReview() {
  const [decisions, setDecisions] = useState<Record<string, Decision | undefined>>({})
  const [reasons, setReasons] = useState<Record<string, string>>({})
  const [choosing, setChoosing] = useState<string | null>(null)
  const [showAll, setShowAll] = useState(false)
  const items = showAll ? [...REVIEW_ITEMS, ...REMAINING_ITEMS] : REVIEW_ITEMS
  const counts = summarize(decisions)
  const decide = (id: string, decision: Decision) => {
    setDecisions((current) => ({ ...current, [id]: decision }))
    setChoosing(null)
  }
  const chooseReason = (id: string, reason: string) => {
    setReasons((current) => ({ ...current, [id]: reason }))
    decide(id, 'accepted')
  }
  return {
    items,
    decisions,
    reasons,
    choosing,
    setChoosing,
    decide,
    chooseReason,
    counts,
    showAll,
    showRemaining: () => setShowAll(true),
    remainingHidden: showAll ? 0 : REMAINING_ITEMS.length,
    confirmable: canConfirm(counts),
  }
}
