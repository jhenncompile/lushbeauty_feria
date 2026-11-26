import { formatBs } from '../../../shared/money'
import { WebScreen } from '../../../shared/layout'
import { Button, Panel, Stat, Steps, Tag } from '../../../shared/ui'
import { getPolicy } from '../../catalog'
import { commissionOnCharged, commissionOnList, netPay, totals } from '../domain/payroll'
import { useSettlement } from '../settlement'
import { useApproveFlow } from '../components/useApproveFlow'
import { STEP_INDEX, STEP_NAMES } from '../steps'

export function WebNominaPage() {
  const settlement = useSettlement()
  const flow = useApproveFlow({ notify: true })
  const policy = getPolicy()
  const sum = totals(settlement.statements)
  const detail = settlement.statements.find((item) => item.lines)
  const onList = detail?.lines ? commissionOnList(detail.lines, policy.commissionBps) : 0
  const onCharged = detail?.lines ? commissionOnCharged(detail.lines, policy.commissionBps) : 0
  const approved = settlement.status === 'aprobada'

  return (
    <WebScreen>
      <div className="row row--between">
        <div className="stack" style={{ gap: 'var(--space-2)' }}>
          <p className="eyebrow">{settlement.weekLabel}</p>
          <h1 className="display-lg">Liquidación semanal</h1>
        </div>
        {approved ? (
          <Tag tone="ok">Liquidación aprobada</Tag>
        ) : (
          <Button onClick={flow.request} disabled={!settlement.canApprove}>
            Aprobar liquidación
          </Button>
        )}
      </div>
      {!approved && !settlement.canApprove ? (
        <p className="t-caption">Aprobar una liquidación requiere conexión.</p>
      ) : null}
      <Steps label="Estado de la liquidación" steps={STEP_NAMES} current={STEP_INDEX[settlement.status]} />
      <div className="cols cols--21">
        <section className="stack--lg stack">
          <div className="scroll">
            <table className="tbl tbl--web">
              <thead>
                <tr>
                  <th className="l" scope="col">Especialista</th>
                  <th scope="col">Comisión 35&thinsp;%</th>
                  <th scope="col">Propinas</th>
                  <th scope="col">Deducciones</th>
                  <th scope="col">Neto</th>
                </tr>
              </thead>
              <tbody>
                {settlement.statements.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.name}
                      {item.roleNote ? ` (${item.roleNote})` : ''}
                    </td>
                    <td>{formatBs(item.commissionCents)}</td>
                    <td className={item.tipsCents ? 'ok' : undefined}>
                      {item.tipsCents ? `+ ${formatBs(item.tipsCents)}` : formatBs(0)}
                    </td>
                    <td className={item.deductionsCents ? 'rouge' : undefined}>
                      {item.deductionsCents ? formatBs(-item.deductionsCents) : formatBs(0)}
                    </td>
                    <td>{formatBs(netPay(item))}</td>
                  </tr>
                ))}
                <tr className="is-total">
                  <td>Total</td>
                  <td>{formatBs(sum.commissionCents)}</td>
                  <td>{formatBs(sum.tipsCents)}</td>
                  <td>{formatBs(-sum.deductionsCents)}</td>
                  <td>{formatBs(sum.netCents)}</td>
                </tr>
              </tbody>
            </table>
            <p className="t-caption" style={{ marginTop: 'var(--space-3)' }}>
              Cifras ilustrativas. La comisión se calcula por línea con la regla vigente al registrar cada venta.
            </p>
          </div>
          <Panel>
            <p className="eyebrow">Después de aprobar</p>
            <p className="t-body">
              Se emite un comprobante PDF por especialista y se envía un aviso individual. Si un aviso falla, la
              liquidación sigue registrada y el aviso se puede reintentar.
            </p>
          </Panel>
        </section>
        <aside className="stack--lg stack">
          <Stat label="Total a pagar" value={formatBs(sum.netCents)} delta="Sin diferencias de cálculo" tone="up" note="Ilustrativo" />
          {detail?.lines ? (
            <section>
              <p className="eyebrow">Detalle · {detail.name}</p>
              <div style={{ marginTop: 'var(--space-2)' }}>
                {detail.lines.map((line, index) => (
                  <div className={index === 0 ? 'line line--top' : 'line'} key={line.serviceName}>
                    <div>
                      <p className="t-body">{line.serviceName}</p>
                      <p className="t-caption">
                        Lista {formatBs(line.listCents, { decimals: 0 })} · Cobrado{' '}
                        {formatBs(line.listCents - line.discountCents, { decimals: 0 })}
                      </p>
                    </div>
                    <span className="line__value--md">{formatBs(commissionOnList([line], policy.commissionBps))}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          <Panel>
            <p className="eyebrow">Comparación de políticas</p>
            <p className="t-caption">Simulación. No altera la liquidación.</p>
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
        </aside>
      </div>
      {flow.dialogs}
    </WebScreen>
  )
}
