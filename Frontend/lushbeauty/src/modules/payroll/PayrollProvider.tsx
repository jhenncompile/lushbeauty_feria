import { useState } from 'react'
import type { ReactNode } from 'react'
import { useConnection } from '../../shared/connection'
import { INITIAL_NOTICES, STATEMENTS, WEEK_LABEL } from './fixtures'
import { SettlementContext } from './settlement'
import type { SettlementApi } from './settlement'
import type { Notice, SettlementStatus } from './types'

/** Estado de la liquidación semanal. Una vez aprobada es inmutable: no hay acción que la reabra. */
export function PayrollProvider({ children, initialStatus = 'verificada' }: { children: ReactNode; initialStatus?: SettlementStatus }) {
  const { online } = useConnection()
  const [status, setStatus] = useState<SettlementStatus>(initialStatus)
  const [notices, setNotices] = useState<Notice[]>(INITIAL_NOTICES)

  const api: SettlementApi = {
    weekLabel: WEEK_LABEL,
    statements: STATEMENTS,
    status,
    notices,
    canApprove: online && status === 'verificada',
    verify: () => setStatus((current) => (current === 'borrador' ? 'verificada' : current)),
    approve: () => {
      if (!online || status !== 'verificada') return false
      setStatus('aprobada')
      return true
    },
    // El aviso es independiente de la liquidación: reintentarlo no la modifica.
    retryNotice: (statementId) =>
      setNotices((current) =>
        current.map((notice) =>
          notice.statementId === statementId ? { statementId, name: notice.name, status: 'enviado' } : notice,
        ),
      ),
  }
  return <SettlementContext value={api}>{children}</SettlementContext>
}
