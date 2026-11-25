import { Navigate } from 'react-router-dom'
import { formatBs } from '../../../shared/money'
import { MobileScreen, ROUTES } from '../../../shared/layout'
import { Button, Tag } from '../../../shared/ui'
import { totals } from '../domain/payroll'
import { useSettlement } from '../settlement'

export function AprobadaPage() {
  const settlement = useSettlement()
  if (settlement.status !== 'aprobada') return <Navigate to={ROUTES.payroll} replace />
  const sum = totals(settlement.statements)
  return (
    <MobileScreen
      header={
        <section className="lb-on-inverse saved__hero">
          <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeWidth="1" />
            <path className="tick" d="M11 21 L18 28 L30 13" />
          </svg>
          <h1 className="eyebrow">Liquidación aprobada</h1>
          <p className="saved__amount">{formatBs(sum.netCents, { decimals: 0 })}</p>
          <p className="t-body">
            {settlement.weekLabel} · {settlement.statements.length} comprobantes emitidos
          </p>
          <p className="t-caption">Ilustrativo</p>
        </section>
      }
      footer={
        <Button block to={ROUTES.home}>
          Volver a Hoy
        </Button>
      }
    >
      <div>
        <p className="eyebrow">Avisos a especialistas</p>
        <ul style={{ marginTop: 'var(--space-2)' }}>
          {settlement.notices.map((notice) => (
            <li className="line" key={notice.statementId}>
              {notice.status === 'error' ? (
                <div style={{ maxWidth: 220 }}>
                  <p className="line__label">{notice.name}</p>
                  <p className="t-caption rouge">Error: {notice.error}</p>
                </div>
              ) : (
                <span className="line__label">{notice.name}</span>
              )}
              <Tag tone={notice.status === 'error' ? 'rouge' : 'ok'}>{notice.status === 'error' ? 'Error' : 'Enviado'}</Tag>
            </li>
          ))}
        </ul>
      </div>
      <p className="t-caption">La liquidación ya quedó registrada. Los avisos son independientes y se pueden reintentar.</p>
      {settlement.notices
        .filter((notice) => notice.status === 'error')
        .map((notice) => (
          <Button
            key={notice.statementId}
            variant="link"
            style={{ alignSelf: 'flex-start' }}
            onClick={() => settlement.retryNotice(notice.statementId)}
          >
            Reintentar aviso a {notice.name}
          </Button>
        ))}
    </MobileScreen>
  )
}
