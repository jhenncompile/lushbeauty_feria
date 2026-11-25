import { MobileScreen, ROUTES } from '../../../shared/layout'
import { Button } from '../../../shared/ui'
import { AssumptionList } from '../components/Recommendation'
import { recommendation } from '../domain/recommendation'

export function RecomendacionPage() {
  const { headline, reason } = recommendation()
  return (
    <MobileScreen title="Decision Studio" backTo={ROUTES.comparison}>
      <section className="panel" style={{ padding: 'var(--space-6) var(--space-5)' }}>
        <p className="eyebrow">Lush Insight sugiere</p>
        <h2 className="t-headline">{headline}</h2>
        <p className="t-body muted">{reason}</p>
        <div>
          <p className="eyebrow">Supuestos</p>
          <div style={{ marginTop: 'var(--space-2)' }}>
            <AssumptionList />
          </div>
        </div>
        <div>
          <p className="eyebrow">Qué cambiaría la decisión</p>
          <p className="t-body" style={{ marginTop: 'var(--space-2)' }}>
            Si la atracción de clientas pesa 50&thinsp;% o más, el descuento de 10&thinsp;% pasa a ser la mejor opción.
          </p>
        </div>
        <p className="t-caption">No se informa utilidad neta: faltan los costos fijos.</p>
        <div className="pair" style={{ flexDirection: 'column' }}>
          <Button to={ROUTES.history}>Aprobar</Button>
          <Button variant="secondary" to={ROUTES.decisions}>Descartar</Button>
        </div>
      </section>
      <p className="t-caption">
        La decisión es de la administradora. Lush Insight no cambia precios ni comisiones por sí solo. Solo la
        administradora puede aprobar.
      </p>
    </MobileScreen>
  )
}
