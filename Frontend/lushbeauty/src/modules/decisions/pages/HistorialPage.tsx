import { ADMIN_TABS, MobileScreen, ROUTES } from '../../../shared/layout'
import { Button, Tag } from '../../../shared/ui'
import { DECISIONS } from '../fixtures'

export function HistorialPage() {
  return (
    <MobileScreen
      title="Decision Studio"
      backTo={ROUTES.home}
      tabs={ADMIN_TABS}
      footer={<Button block to={ROUTES.decisions}>Nueva simulación</Button>}
      footerBorderless
    >
      <div>
        <p className="eyebrow">Historial</p>
        <h2 className="t-headline" style={{ marginTop: 'var(--space-2)' }}>Decisiones</h2>
      </div>
      {DECISIONS.map((decision) => (
        <article className="item" key={decision.code}>
          <div className="item__head">
            <p className="eyebrow">{decision.code}</p>
            <Tag tone="ok">{decision.status}</Tag>
          </div>
          <p className="t-title">{decision.title}</p>
          <div>
            <div className="line"><span className="t-caption">Responsable</span><span className="line__value--md">{decision.owner}</span></div>
            <div className="line"><span className="t-caption">Fecha</span><span className="line__value--md">{decision.date}</span></div>
            <div className="line"><span className="t-caption">Resultado esperado</span><span className="line__value--md">{decision.expected}</span></div>
            <div className="line"><span className="t-caption">Revisión posterior</span><span className="line__value--md">{decision.review}</span></div>
          </div>
          <Button variant="link" to={ROUTES.recommendation} style={{ alignSelf: 'flex-start' }}>Ver supuestos</Button>
          <p className="t-caption">
            Cifra ilustrativa. El historial conserva el escenario original; la revisión posterior no lo reescribe.
          </p>
        </article>
      ))}
    </MobileScreen>
  )
}
