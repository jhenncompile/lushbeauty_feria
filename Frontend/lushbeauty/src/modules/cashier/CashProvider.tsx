import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useConnection } from '../../shared/connection'
import { parseAmountToCents } from '../../shared/money'
import { reconcile, requiresJustification } from './domain/reconcile'
import { useSession } from '../identity'
import { expectedFor, isoDay, listCierres, postCierre, summarizeCierres } from './api/caja'
import type { CloseSummary } from './api/caja'
import { CLOSE_DATE, EXPECTED, LAST_CLOSES } from './fixtures'
import { CashContext } from './cash'
import type { CashApi } from './cash'

/** Cierre de caja del día. Una vez cerrado no se edita: cualquier cambio posterior sería un ajuste con historial. */
export function CashProvider({ children }: { children: ReactNode }) {
  const { online } = useConnection()
  const token = useSession().session?.token
  const day = isoDay(new Date())
  const [expected, setExpected] = useState(EXPECTED)
  const [lastCloses, setLastCloses] = useState<CloseSummary[]>(LAST_CLOSES)
  const [loadError, setLoadError] = useState(false)
  const [closeError, setCloseError] = useState<string>()
  const [countedText, setCountedText] = useState('')
  const [justification, setJustification] = useState('')
  const [closed, setClosed] = useState(false)
  const [attempted, setAttempted] = useState(false)

  // Con sesión real el esperado sale de las ventas confirmadas del día y los últimos cierres del servidor.
  useEffect(() => {
    if (!token) return
    let active = true
    Promise.all([expectedFor(token, day), listCierres(token)])
      .then(([list, cierres]) => {
        if (!active) return
        setExpected(list)
        setLastCloses(summarizeCierres(cierres))
      })
      .catch(() => active && setLoadError(true))
    return () => {
      active = false
    }
  }, [token, day])

  const counted = parseAmountToCents(countedText)
  const reconciliation = counted === null ? null : reconcile(expected, counted)
  const needsJustification = reconciliation ? requiresJustification(reconciliation.cashDiffCents) : false
  const countedInvalid = counted === null
  const justificationMissing = needsJustification && !justification.trim()

  const api: CashApi = {
    date: token ? new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date()).replace(/\./g, '') : CLOSE_DATE,
    illustrative: !token,
    lastCloses,
    loadError: loadError ? 'No se pudo leer el esperado del día. Recargue la página.' : undefined,
    closeError,
    countedText,
    setCountedText: (value) => !closed && setCountedText(value),
    justification,
    setJustification: (value) => !closed && setJustification(value),
    reconciliation,
    countedError: attempted && countedInvalid ? 'Escriba el efectivo contado, por ejemplo 402 o 402,50.' : undefined,
    justificationError: attempted && justificationMissing ? 'Explique la diferencia para cerrar la caja.' : undefined,
    canClose: online && !closed && !loadError,
    closed,
    validate: () => {
      setAttempted(true)
      return online && !closed && !countedInvalid && !justificationMissing
    },
    close: () => {
      setAttempted(true)
      if (!online || closed || countedInvalid || justificationMissing) return false
      if (!token || !reconciliation) {
        setClosed(true)
        return true
      }
      const declarations = reconciliation.rows.map((row) => ({
        method: row.method,
        cents: row.declaredCents,
        justification: row.method === 'Efectivo' ? justification.trim() : undefined,
      }))
      setCloseError(undefined)
      return postCierre(token, day, declarations).then(
        () => {
          setClosed(true)
          return true
        },
        (error: unknown) => {
          setCloseError(error instanceof Error ? error.message : 'No se pudo cerrar la caja.')
          return false
        },
      )
    },
  }
  return <CashContext value={api}>{children}</CashContext>
}
