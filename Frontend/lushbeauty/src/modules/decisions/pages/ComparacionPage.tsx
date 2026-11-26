import { ADMIN_TABS, MobileScreen, ROUTES } from '../../../shared/layout'
import { Button } from '../../../shared/ui'
import { MatrixTable, Sensitivity, WeightsCheck } from '../components/Matrix'

export function ComparacionPage() {
  return (
    <MobileScreen
      title="Decision Studio"
      backTo={ROUTES.decisions}
      tabs={ADMIN_TABS}
      footer={<Button block to={ROUTES.recommendation}>Ver recomendación</Button>}
      footerBorderless
    >
      <div>
        <p className="eyebrow">Comparación multicriterio</p>
        <h2 className="t-headline" style={{ marginTop: 'var(--space-2)' }}>Tres alternativas</h2>
      </div>
      <MatrixTable />
      <WeightsCheck />
      <section>
        <p className="eyebrow">Sensibilidad</p>
        <div className="stack" style={{ marginTop: 'var(--space-2)', gap: 'var(--space-3)' }}>
          <Sensitivity />
        </div>
      </section>
      <p className="t-caption">
        Los puntajes de atracción y simplicidad son supuestos de la administradora, de 0 a 10. Ilustrativo.
      </p>
    </MobileScreen>
  )
}
