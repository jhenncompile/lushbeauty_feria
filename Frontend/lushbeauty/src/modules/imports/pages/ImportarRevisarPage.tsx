import { MobileScreen, ROUTES } from '../../../shared/layout'
import { Button } from '../../../shared/ui'
import { ReviewActions } from '../components/ReviewActions'
import { useReview } from '../components/useReview'

export function ImportarRevisarPage() {
  const review = useReview()
  const { counts } = review
  return (
    <MobileScreen
      title="Importar planilla"
      backTo={ROUTES.import}
      footer={
        <>
          {review.confirmable ? (
            <Button block to={ROUTES.home}>Confirmar importación</Button>
          ) : (
            <Button block disabled>Confirmar importación</Button>
          )}
          <p className="t-caption" style={{ textAlign: 'center' }}>
            {review.confirmable
              ? 'Todo revisado. Al confirmar se guarda la importación con su historial.'
              : `Revise los ${counts.toReview} registros pendientes para continuar.`}
          </p>
        </>
      }
    >
      <div>
        <p className="eyebrow">Paso 2 de 3 · Revisar</p>
        <h1 className="t-headline" style={{ marginTop: 'var(--space-2)' }}>91 filas leídas</h1>
      </div>
      <div>
        <div className="line line--top"><span className="line__label">Aceptadas</span><span className="line__value--md">{counts.accepted}</span></div>
        <div className="line"><span className="line__label">Para revisar</span><span className="line__value--md">{counts.toReview}</span></div>
        <div className="line"><span className="line__label">Rechazadas</span><span className="line__value--md">{counts.rejected}</span></div>
        <p className="t-caption" style={{ marginTop: 'var(--space-2)' }}>Ilustrativo</p>
      </div>
      <section>
        <p className="eyebrow">Para revisar · {review.items.length} de 11</p>
        <div style={{ marginTop: 'var(--space-3)' }}>
          {review.items.map((item) => (
            <article className="item" key={item.id}>
              <p className="t-caption">{item.origin}</p>
              <p className="t-body">
                {item.original} {item.sentence} <span className="t-label">{item.proposal}</span>
              </p>
              <p className={item.needsReason ? 't-caption rouge' : 't-caption'}>
                {item.needsReason
                  ? 'Diferencia de Bs 8 sin motivo. Elija un motivo de descuento para aceptarla.'
                  : item.reason}
              </p>
              <ReviewActions
                item={item}
                decision={review.decisions[item.id]}
                reason={review.reasons[item.id]}
                choosing={review.choosing === item.id}
                onDecide={(decision) => review.decide(item.id, decision)}
                onStartChoosing={() => review.setChoosing(item.id)}
                onReason={(reason) => review.chooseReason(item.id, reason)}
              />
            </article>
          ))}
        </div>
        {review.remainingHidden > 0 ? (
          <Button variant="link" onClick={review.showRemaining}>
            Ver las {review.remainingHidden} restantes
          </Button>
        ) : null}
      </section>
    </MobileScreen>
  )
}
