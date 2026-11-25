import { createContext, useContext } from 'react'
import type { Notice, SettlementStatus, Statement } from './types'

export interface SettlementApi {
  weekLabel: string
  statements: Statement[]
  status: SettlementStatus
  notices: Notice[]
  /** Aprobar exige conexión (el servidor es la fuente de verdad). */
  canApprove: boolean
  verify: () => void
  approve: () => boolean
  retryNotice: (statementId: string) => void
}

export const SettlementContext = createContext<SettlementApi | null>(null)

export function useSettlement(): SettlementApi {
  const api = useContext(SettlementContext)
  if (!api) throw new Error('useSettlement debe usarse dentro de PayrollProvider')
  return api
}
