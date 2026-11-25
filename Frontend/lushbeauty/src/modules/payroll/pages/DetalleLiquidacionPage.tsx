import { Navigate, useParams } from 'react-router-dom'
import { formatBs } from '../../../shared/money'
import { ADMIN_TABS, MobileScreen, ROUTES } from '../../../shared/layout'
import { Button, Panel, Stat } from '../../../shared/ui'
import { getPolicy } from '../../catalog'
import { commissionOnCharged, commissionOnList, netPay } from '../domain/payroll'
import { useSettlement } from '../settlement'

export function DetalleLiquidacionPage() {
  const { id } = useParams()
  const settlement = useSettlement()
  const policy = getPolicy()
  const item = settlement.statements.find((statement) => statement.id === id)
  if (!item) return <Navigate to={ROUTES.payroll} replace />

  const lines = item.lines
  const onList = lines ? commissionOnList(lines, policy.commissionBps) : null
  const onCharged = lines ? commissionOnCharged(lines, policy.commissionBps) : null
  return (
    <MobileScreen
      title={item.name}
      backTo={ROUTES.payroll}
      tabs={ADMIN_TABS}
      footerBorderless
      footer={
        <Button block to={ROUTES.payroll}>
          Volver a la liquidación
        </Button>
      }
    >
      <div>
        <p className="eyebrow">{settlement.weekLabel}</p>
        <h2 className="t-headline" style={{ marginTop: 'var(--space-2)' }}>
          Detalle de {item.name}
        </h2>
      </div>
      {lines ? (
        <ul>
          {lines.map((line, index) => (
            <li className={index === 0 ? 'line line--top' : 'line'} key={line.serviceName}>
              <div>
                <p className="t-body">{line.serviceName}</p>
                <p className="t-caption">
                  Lista {formatBs(line.listCents, { decimals: 0 })} · Descuento{' '}
                  {formatBs(line.discountCents, { decimals: 0 })} · Cobrado{' '}
                  {formatBs(line.listCents - line.discountCents, { decimals: 0 })}
                </p>
              </div>
              <span className="line__value--md">{formatBs(commissionOnList([line], policy.commissionBps))}</span>
            </li>
          ))}
        </ul>
      ) : (
        <Panel>
          <p className="t-body">El detalle por servicio de {item.name} llega con el servidor; esta maqueta solo lo trae de Paty.</p>
        </Panel>
      )}
      <div>
        <div className="line">
          <span className="line__label">Comisión 35&thinsp;% sobre lista</span>
          <span className="line__value--md">{formatBs(item.commissionCents)}</span>
        </div>
        <div className="line">
          <span className="line__label">Propinas</span>
          <span className="line__value--md ok">+ {formatBs(item.tipsCents)}</span>
        </div>
        <div className="line">
          <span className="line__label">{item.deductionLabel}</span>
          <span className="line__value--md rouge">{formatBs(-item.deductionsCents)}</span>
        </div>
      </div>
      <Stat label="Neto a pagar" value={formatBs(netPay(item))} note="Ilustrativo" />
      {onList !== null && onCharged !== null ? (
        <Panel>
          <p className="eyebrow">Comparación de políticas</p>
          <p className="t-caption">Es una simulación. No altera la liquidación.</p>
          <div className="line" style={{ paddingTop: 0 }}>
            <span className="line__label">Sobre precio de lista (vigente)</span>
            <span className="line__value--md">{formatBs(onList)}</span>
          </div>
          <div className="line" style={{ paddingTop: 0 }}>
            <span className="line__label">Sobre importe cobrado</span>
            <span className="line__value--md">{formatBs(onCharged)}</span>
          </div>
          <div className="line" style={{ paddingTop: 0, borderBottom: 0 }}>
            <span className="line__label">Diferencia</span>
            <span className="line__value--md">{formatBs(onList - onCharged)}</span>
          </div>
        </Panel>
      ) : null}
    </MobileScreen>
  )
}
