import { Navigate, useNavigate } from 'react-router-dom'
import { formatBs } from '../../../shared/money'
import { MobileScreen, ROUTES } from '../../../shared/layout'
import { useConnection } from '../../../shared/connection'
import { CountBs } from '../../../shared/motion'
import { Backdrop, Button } from '../../../shared/ui'
import { useRegistroServicio } from '../draft'
import { formatPercent } from '../domain/sale'

export function GuardadoPage() {
  const { saved, undoSaved } = useRegistroServicio()
  const navigate = useNavigate()
  const { online } = useConnection()
  if (!saved) return <Navigate to={ROUTES.register} replace />

  const whole = saved.chargedCents % 100 === 0
  return (
    <MobileScreen
      header={
        <section className="lb-on-inverse rel saved__hero">
          <Backdrop opacity={0.16} />
          <svg className="above" width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
            <circle cx="20" cy="20" r="19" fill="none" stroke="currentColor" strokeWidth="1" />
            <path className="tick" d="M11 21 L18 28 L30 13" />
          </svg>
          <p className="eyebrow above rise d1">Servicio guardado</p>
          <p className="saved__amount above rise d2">
            <CountBs cents={saved.chargedCents} decimals={whole ? 0 : 2} />
          </p>
          <p className="t-body">
            {saved.serviceName} · {saved.specialistName} · {saved.method}
          </p>
          <p className="t-caption">{saved.savedAt} ·{' '}
            {online ? 'Enviado (simulado, sin servidor)' : 'Guardado en este teléfono: se enviará al volver la conexión'}</p>
        </section>
      }
      footer={
        <>
          <Button block to={ROUTES.register}>
            Registrar otro servicio
          </Button>
          <Button block variant="secondary" to={ROUTES.home}>
            Volver a Hoy
          </Button>
        </>
      }
    >
      <div>
        <div className="line">
          <span className="line__label">Precio de lista</span>
          <span className="line__value--md">{formatBs(saved.listCents)}</span>
        </div>
        {saved.discountCents > 0 ? (
          <div className="line">
            <span className="line__label">Descuento · {saved.discountReason}</span>
            <span className="line__value--md rouge">{formatBs(-saved.discountCents)}</span>
          </div>
        ) : null}
        <div className="line">
          <span className="line__label">Comisión {formatPercent(saved.commissionBps)} sobre lista</span>
          <span className="line__value--md">{formatBs(saved.commissionCents)}</span>
        </div>
      </div>
      <div>
        <Button
          variant="link"
          onClick={() => {
            undoSaved()
            navigate(ROUTES.home)
          }}
        >
          Deshacer este registro
        </Button>
        <p className="t-caption" style={{ marginTop: 'var(--space-1)' }}>
          Deshacer anula 1 servicio de {formatBs(saved.chargedCents, { decimals: whole ? 0 : 2 })} y deja un ajuste.
        </p>
      </div>
    </MobileScreen>
  )
}
