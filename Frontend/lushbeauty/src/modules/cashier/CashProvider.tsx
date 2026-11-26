import { useState } from 'react'
import type { ReactNode } from 'react'
import { useConnection } from '../../shared/connection'
import { parseAmountToCents } from '../../shared/money'
import { reconcile, requiresJustification } from './domain/reconcile'
import { CLOSE_DATE, EXPECTED } from './fixtures'
import { CashContext } from './cash'
import type { CashApi } from './cash'

/** Cierre de caja del día. Una vez cerrado no se edita: cualquier cambio posterior sería un ajuste con historial. */
export function CashProvider({ children }: { children: ReactNode }) {
  const { online } = useConnection()
  const [countedText, setCountedText] = useState('')
  const [justification, setJustification] = useState('')
  const [closed, setClosed] = useState(false)
  const [attempted, setAttempted] = useState(false)

  const counted = parseAmountToCents(countedText)
  const reconciliation = counted === null ? null : reconcile(EXPECTED, counted)
  const needsJustification = reconciliation ? requiresJustification(reconciliation.cashDiffCents) : false
  const countedInvalid = counted === null
  const justificationMissing = needsJustification && !justification.trim()

  const api: CashApi = {
    date: CLOSE_DATE,
    countedText,
    setCountedText: (value) => !closed && setCountedText(value),
    justification,
    setJustification: (value) => !closed && setJustification(value),
    reconciliation,
    countedError: attempted && countedInvalid ? 'Escriba el efectivo contado, por ejemplo 402 o 402,50.' : undefined,
    justificationError: attempted && justificationMissing ? 'Explique la diferencia para cerrar la caja.' : undefined,
    canClose: online && !closed,
    closed,
    validate: () => {
      setAttempted(true)
      return online && !closed && !countedInvalid && !justificationMissing
    },
    close: () => {
      setAttempted(true)
      if (!online || closed || countedInvalid || justificationMissing) return false
      setClosed(true)
      return true
    },
  }
  return <CashContext value={api}>{children}</CashContext>
}
