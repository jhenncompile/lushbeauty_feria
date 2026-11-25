import { formatBs } from '../../../shared/money'
import { MobileScreen, ROUTES, SPECIALIST_TABS } from '../../../shared/layout'
import { Button, Panel, Stat } from '../../../shared/ui'
import { useSession } from '../../identity'
import { netPay } from '../domain/payroll'
import { useSettlement } from '../settlement'

export function MiLiquidacionPage() {
  const settlement = useSettlement()
  const { session } = useSession()
  // Solo la propia: se filtra por quien inició sesión, nunca se listan las demás.
  const own = settlement.statements.find((item) => item.name.toLowerCase() === session?.userName.trim().toLowerCase())
  const approved = settlement.status === 'aprobada'
  return (
    <MobileScreen tabs={SPECIALIST_TABS} footerBorderless footer={own ? <><Button block disabled>Descargar comprobante</Button><p className="t-caption" style={{ textAlign: 'center' }}>El comprobante PDF se emite al aprobar la liquidación, con el servidor.</p></> : null}>
      <div>
        <p className="eyebrow">
          {own?.name ?? session?.userName} · {settlement.weekLabel}
        </p>
        <h1 className="t-headline" style={{ marginTop: 'var(--space-2)' }}>
          Mi liquidación
        </h1>
      </div>
      {own ? (
        <>
          <Stat
            label="Neto a pagar"
            value={formatBs(netPay(own))}
            delta={approved ? 'Aprobada el 23 nov' : 'Pendiente de aprobación'}
            tone={approved ? 'up' : 'neutral'}
            note="Ilustrativo"
          />
          <div>
            <div className="line">
              <span className="line__label">Comisión 35&thinsp;% sobre lista</span>
              <span className="line__value--md">{formatBs(own.commissionCents)}</span>
            </div>
            <div className="line">
              <span className="line__label">Propinas</span>
              <span className="line__value--md ok">+ {formatBs(own.tipsCents)}</span>
            </div>
            <div className="line">
              <span className="line__label">{own.deductionLabel}</span>
              <span className="line__value--md rouge">{formatBs(-own.deductionsCents)}</span>
            </div>
          </div>
        </>
      ) : (
        <Panel>
          <p className="t-body">No hay una liquidación para su usuario en esta semana.</p>
        </Panel>
      )}
      <Panel>
        <p className="t-body">
          Solo usted puede ver este detalle. Las liquidaciones de otras especialistas no están disponibles para su
          cuenta.
        </p>
      </Panel>
      <Button variant="link" to={ROUTES.register} style={{ alignSelf: 'flex-start' }}>
        Registrar un servicio
      </Button>
    </MobileScreen>
  )
}
