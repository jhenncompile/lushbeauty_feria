import { createContext, useContext } from 'react'
import type { CloseSummary } from './api/caja'
import type { Reconciliation } from './domain/reconcile'

export interface CashApi {
  date: string
  /** true con datos de ejemplo (sin sesión real). */
  illustrative: boolean
  /** Últimos cierres para el panel lateral. */
  lastCloses: CloseSummary[]
  /** Error al leer el esperado del día o al registrar el cierre. */
  loadError?: string
  closeError?: string
  countedText: string
  setCountedText: (value: string) => void
  justification: string
  setJustification: (value: string) => void
  /** null mientras el efectivo contado no sea un importe válido. */
  reconciliation: Reconciliation | null
  countedError?: string
  justificationError?: string
  /** El cierre final se registra en línea. */
  canClose: boolean
  closed: boolean
  /** Marca los errores visibles y dice si el cierre es posible, sin cerrar (para confirmar antes). */
  validate: () => boolean
  /** Síncrono con datos de ejemplo; asíncrono (POST) con sesión real. */
  close: () => boolean | Promise<boolean>
}

export const CashContext = createContext<CashApi | null>(null)

export function useCashClose(): CashApi {
  const api = useContext(CashContext)
  if (!api) throw new Error('useCashClose debe usarse dentro de CashProvider')
  return api
}
