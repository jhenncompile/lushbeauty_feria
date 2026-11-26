import { Link, useNavigate } from 'react-router-dom'
import { formatBs } from '../../../shared/money'
import { ADMIN_TABS, MobileScreen, payrollDetailRoute, ROUTES } from '../../../shared/layout'
import { Button, Stat, Steps, Tag } from '../../../shared/ui'
import { netPay, totals } from '../domain/payroll'
import { STEP_INDEX, STEP_NAMES } from '../steps'
import { useSettlement } from '../settlement'
import { useApproveFlow } from '../components/useApproveFlow'

export function LiquidacionPage() {
  const settlement = useSettlement()
  const navigate = useNavigate()
  const sum = totals(settlement.statements)

  const flow = useApproveFlow({ onApproved: () => navigate(ROUTES.payrollApproved) })

  const approved = settlement.status === 'aprobada'
  return (
    <MobileScreen
      title="Nómina"
      backTo={ROUTES.home}
      tabs={ADMIN_TABS}
      footerBorderless
      footer={
        approved ? (
          <>
            <Tag tone="ok">Liquidación aprobada</Tag>
            <Button block variant="secondary" to={ROUTES.payrollApproved}>
              Ver comprobantes y avisos
            </Button>
          </>
        ) : (
          <>
            <Button block onClick={flow.request} disabled={!settlement.canApprove}>
              Aprobar liquidación
            </Button>
            <p className="t-caption" style={{ textAlign: 'center' }}>
              {settlement.canApprove
                ? 'Al aprobar se emiten los comprobantes y se avisa a cada especialista. No se puede deshacer.'
                : 'Aprobar una liquidación requiere conexión.'}
            </p>
          </>
        )
      }
    >
      <div>
        <p className="eyebrow">{settlement.weekLabel}</p>
        <h2 className="t-headline" style={{ marginTop: 'var(--space-2)' }}>
          Liquidación semanal
        </h2>
      </div>
      <Steps label="Estado de la liquidación" steps={STEP_NAMES} current={STEP_INDEX[settlement.status]} />
      <Stat label="Total a pagar" value={formatBs(sum.netCents)} delta="Sin diferencias de cálculo" tone="up" note="Ilustrativo" />
      <div>
        <p className="eyebrow">Por especialista</p>
        {settlement.statements.map((item, index) => (
          <Link
            key={item.id}
            className="line line--link"
            style={{ minHeight: 72, marginTop: index === 0 ? 'var(--space-2)' : undefined }}
            to={payrollDetailRoute(item.id)}
          >
            <div>
              <p className="t-body">
                {item.name}
                {item.roleNote ? ` (${item.roleNote})` : ''}
              </p>
              <p className="t-caption">
                Comisión {formatBs(item.commissionCents)} · Propinas {formatBs(item.tipsCents)} · Deducciones{' '}
                {formatBs(item.deductionsCents)}
              </p>
            </div>
            <span className="line__value">{formatBs(netPay(item), { decimals: 0 })}</span>
          </Link>
        ))}
      </div>
      <p className="t-caption">
        Comisión de 35&thinsp;% sobre el precio de lista, según la regla vigente al registrar cada venta. Valor
        ilustrativo.
      </p>
      {flow.dialogs}
    </MobileScreen>
  )
}
