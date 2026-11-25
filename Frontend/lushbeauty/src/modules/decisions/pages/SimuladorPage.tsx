import { ADMIN_TABS, MobileScreen, ROUTES } from '../../../shared/layout'
import { Button } from '../../../shared/ui'
import { Scenario } from '../components/Scenario'

export function SimuladorPage() {
  return (
    <MobileScreen
      title="Decision Studio"
      backTo={ROUTES.home}
      tabs={ADMIN_TABS}
      footer={<Button block to={ROUTES.comparison}>Comparar alternativas</Button>}
      footerBorderless
    >
      <div>
        <p className="eyebrow">Escenario hipotético</p>
        <h1 className="t-headline" style={{ marginTop: 'var(--space-2)' }}>Descuento en Manicura gel</h1>
      </div>
      <Scenario />
      <p className="t-caption">
        Escenario hipotético e ilustrativo. No modifica ventas, nóminas ni políticas de comisión. La comisión de
        35&thinsp;% se calcula sobre el precio de lista.
      </p>
    </MobileScreen>
  )
}
