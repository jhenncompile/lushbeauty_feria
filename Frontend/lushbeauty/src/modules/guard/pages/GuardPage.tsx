import { MobileScreen, ROUTES } from '../../../shared/layout'
import { Button, Tag } from '../../../shared/ui'
import { useAlerts } from '../components/useAlerts'

export function GuardPage() {
  const { alerts, pending, review } = useAlerts()
  return (
    <MobileScreen title="Lush Guard" backTo={ROUTES.home}>
      <div>
        <h1 className="t-headline">{pending === 1 ? '1 alerta por revisar' : `${pending} alertas por revisar`}</h1>
        <p className="t-body muted" style={{ marginTop: 'var(--space-2)' }}>
          Las alertas siguen reglas configuradas. Una alerta no indica una conducta indebida.
        </p>
      </div>
      <section>
        {alerts.map((alert) => (
          <article className="item" key={alert.id}>
            <div className="item__head">
              <h2 className="t-title">{alert.rule}</h2>
              <Tag tone={alert.status === 'pending' ? 'rouge' : 'ok'}>{alert.status === 'pending' ? 'Por revisar' : 'Revisada'}</Tag>
            </div>
            <div className="line" style={{ padding: 'var(--space-2) 0' }}>
              <span className="t-caption">Observado</span>
              <span className="line__value--md">{alert.observed.replace(' %', ' %')}</span>
            </div>
            <div className="line" style={{ padding: 'var(--space-2) 0' }}>
              <span className="t-caption">Umbral</span>
              <span className="line__value--md">{alert.threshold.replace(' %', ' %')}</span>
            </div>
            <p className="t-caption">
              {alert.status === 'reviewed' ? `Revisada por ${alert.reviewedBy} · el cambio conserva su historial` : alert.origin}
            </p>
            {alert.status === 'pending' ? (
              <Button variant="secondary" block onClick={() => review(alert.id)}>
                Marcar revisada
              </Button>
            ) : null}
          </article>
        ))}
      </section>
    </MobileScreen>
  )
}
