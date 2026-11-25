import { useNavigate } from 'react-router-dom'
import { formatBs } from '../../../shared/money'
import { MobileScreen, ROUTES, SPECIALIST_TABS } from '../../../shared/layout'
import { Button, Choice } from '../../../shared/ui'
import { useSession } from '../../identity'
import { useRegistroServicio } from '../draft'
import { formatPercent } from '../domain/sale'
import { PAYMENT_METHODS } from '../types'

export function RegistrarPage() {
  const api = useRegistroServicio()
  const { session } = useSession()
  const navigate = useNavigate()
  const { draft, result } = api
  const isSpecialist = session?.role === 'especialista'

  function save() {
    if (api.save()) navigate(ROUTES.saved)
  }

  const hint = !draft.method
    ? 'Elija un método de pago para guardar.'
    : api.needsApproval
      ? 'El descuento supera el límite: necesita la aprobación de la administradora.'
      : null

  return (
    <MobileScreen
      title="Registrar servicio"
      backTo={isSpecialist ? ROUTES.myPayroll : ROUTES.home}
      tabs={isSpecialist ? SPECIALIST_TABS : undefined}
      footer={
        <>
          <Button block onClick={save} disabled={!api.canSave}>
            Guardar servicio
          </Button>
          {hint ? (
            <p className="t-caption" style={{ textAlign: 'center' }}>
              {hint}
            </p>
          ) : null}
        </>
      }
    >
      <section aria-labelledby="sec-servicio">
        <p className="eyebrow" id="sec-servicio">
          Servicio
        </p>
        <div className="choice-stack" style={{ marginTop: 'var(--space-3)' }}>
          {api.services.map((item) => (
            <Choice key={item.id} pressed={item.id === draft.serviceId} onSelect={() => api.pickService(item.id)}>
              <span>{item.name}</span>
              <span className="num">{formatBs(item.listPriceCents, { decimals: 0 })}</span>
            </Choice>
          ))}
        </div>
      </section>
      <section aria-labelledby="sec-especialista">
        <p className="eyebrow" id="sec-especialista">
          Especialista
        </p>
        <div className="choice-row" style={{ marginTop: 'var(--space-3)' }}>
          {api.specialists.map((item) => (
            <Choice key={item.id} pressed={item.id === draft.specialistId} onSelect={() => api.pickSpecialist(item.id)}>
              {item.name}
            </Choice>
          ))}
        </div>
      </section>
      <section aria-labelledby="sec-metodo">
        <p className="eyebrow" id="sec-metodo">
          Método de pago
        </p>
        <div className="choice-row" style={{ marginTop: 'var(--space-3)' }}>
          {PAYMENT_METHODS.map((method) => (
            <Choice key={method} pressed={draft.method === method} onSelect={() => api.pickMethod(method)}>
              {method}
            </Choice>
          ))}
        </div>
      </section>
      <div>
        <div className="line line--top">
          <span className="line__label">Importe</span>
          <span className="line__value">{formatBs(result.chargedCents, { decimals: result.chargedCents % 100 ? 2 : 0 })}</span>
        </div>
        {draft.discount ? (
          <p className="t-caption">
            Lista {formatBs(result.listCents)} · Descuento {formatBs(result.discountCents)} (
            {formatPercent(result.discountBps)}) · {draft.discount.reason}
          </p>
        ) : null}
        <Button variant="link" to={ROUTES.discount}>
          {draft.discount ? 'Cambiar descuento' : 'Aplicar descuento'}
        </Button>
      </div>
    </MobileScreen>
  )
}
