import { ROUTES, WebScreen } from '../../../shared/layout'
import { Button, Panel, Stat, Steps } from '../../../shared/ui'
import { ReviewActions } from '../components/ReviewActions'
import { useReview } from '../components/useReview'
import { FILE, MAPPING } from '../fixtures'

export function WebImportarPage() {
  const review = useReview()
  const { counts } = review
  return (
    <WebScreen>
      <div className="stack" style={{ gap: 'var(--space-2)' }}>
        <Button variant="link" to={ROUTES.webPanel} style={{ alignSelf: 'flex-start' }}>Volver al panel</Button>
        <p className="eyebrow">Importador inteligente</p>
        <h1 className="display-lg">Importar planilla</h1>
      </div>
      <Steps label="Pasos de la importación" steps={['1 · Cargar y mapear', '2 · Revisar', '3 · Confirmar']} current={1} />
      <div className="cols">
        <section className="stack">
          <Panel>
            <p className="eyebrow">Archivo</p>
            <p className="t-title">{FILE.name}</p>
            <p className="t-caption">{FILE.detail}</p>
            <Button variant="secondary" style={{ alignSelf: 'flex-start' }}>Elegir otro archivo</Button>
          </Panel>
          <table className="tbl tbl--web">
            <thead>
              <tr><th className="l" scope="col">Columna de la planilla</th><th className="l" scope="col">Campo del sistema</th></tr>
            </thead>
            <tbody>
              {MAPPING.map((row) => (
                <tr key={row.source}><td>{row.source}</td><td className="l">{row.target}</td></tr>
              ))}
            </tbody>
          </table>
        </section>
        <section className="stack">
          <div className="grid grid--3" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
            <Stat label="Aceptadas" value={String(counts.accepted)} note="Ilustrativo" />
            <Stat label="Para revisar" value={String(counts.toReview)} note="Ilustrativo" />
            <Stat label="Rechazadas" value={String(counts.rejected)} note="Ilustrativo" />
          </div>
          <Panel>
            <p className="eyebrow">Dato faltante</p>
            <p className="t-body">La planilla no incluye el método de pago. Se pedirá en la revisión, registro por registro.</p>
          </Panel>
        </section>
      </div>
      <section>
        <p className="eyebrow">Para revisar · {review.items.length} de 11</p>
        <div className="scroll" style={{ marginTop: 'var(--space-3)' }}>
          <table className="tbl tbl--web">
            <thead>
              <tr>
                <th className="l" scope="col">Origen</th>
                <th className="l" scope="col">Texto original</th>
                <th className="l" scope="col">Propuesta</th>
                <th className="l" scope="col">Motivo</th>
                <th className="l" scope="col">Decisión</th>
              </tr>
            </thead>
            <tbody>
              {review.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.origin}</td>
                  <td className="l">{item.original}</td>
                  <td className="l">{item.proposal}</td>
                  <td className={item.needsReason ? 'l rouge' : 'l'}>{item.reason}</td>
                  <td className="l">
                    <ReviewActions
                      item={item}
                      decision={review.decisions[item.id]}
                      reason={review.reasons[item.id]}
                      choosing={review.choosing === item.id}
                      onDecide={(decision) => review.decide(item.id, decision)}
                      onStartChoosing={() => review.setChoosing(item.id)}
                      onReason={(reason) => review.chooseReason(item.id, reason)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {review.remainingHidden > 0 ? (
          <Button variant="link" style={{ marginTop: 'var(--space-3)' }} onClick={review.showRemaining}>
            Ver las {review.remainingHidden} restantes
          </Button>
        ) : null}
      </section>
      <div className="row">
        <Button disabled={!review.confirmable}>Confirmar importación</Button>
        <span className="t-caption">
          {review.confirmable
            ? 'Todo revisado. Nada se guarda hasta confirmar.'
            : `Revise los ${counts.toReview} registros pendientes para continuar. Nada se guarda hasta confirmar.`}
        </span>
      </div>
      <p className="t-caption">Cada registro importado conserva su archivo, hoja, fila, propuesta y decisión final.</p>
    </WebScreen>
  )
}
