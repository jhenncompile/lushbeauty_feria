import { Button, Choice } from '../../../shared/ui'
import type { Decision } from '../domain/review'
import { DISCOUNT_REASONS } from '../fixtures'
import type { ReviewItem } from '../fixtures'

interface Props {
  item: ReviewItem
  decision?: Decision
  reason?: string
  choosing: boolean
  onDecide: (decision: Decision) => void
  onStartChoosing: () => void
  onReason: (reason: string) => void
}

/** Botones de decisión de una fila; el resultado se dice con palabras. */
export function ReviewActions({ item, decision, reason, choosing, onDecide, onStartChoosing, onReason }: Props) {
  if (decision) {
    return (
      <span className="t-caption" role="status">
        {decision === 'accepted' ? `Aceptada${reason ? ` · ${reason}` : ''}` : 'Rechazada'}
      </span>
    )
  }
  return (
    <div className="stack" style={{ gap: 'var(--space-3)' }}>
      <div className="row">
        {item.needsReason ? (
          <Button variant="secondary" className="btn-compact" onClick={onStartChoosing}>
            Elegir motivo
          </Button>
        ) : (
          <Button variant="secondary" className="btn-compact" onClick={() => onDecide('accepted')}>
            Aceptar
          </Button>
        )}
        <Button variant="secondary" className="btn-compact" onClick={() => onDecide('rejected')}>
          Rechazar
        </Button>
      </div>
      {choosing ? (
        <div className="choice-row choice-row--2" role="group" aria-label="Motivo del descuento">
          {DISCOUNT_REASONS.map((label) => (
            <Choice key={label} pressed={false} onSelect={() => onReason(label)}>
              {label}
            </Choice>
          ))}
        </div>
      ) : null}
    </div>
  )
}
