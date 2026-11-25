import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatBs, parseAmountToCents } from '../../../shared/money'
import { MobileScreen, ROUTES } from '../../../shared/layout'
import { Button, Choice, Field, Panel } from '../../../shared/ui'
import { getPolicy } from '../../catalog'
import { useRegistroServicio } from '../draft'
import { calculateSale, formatPercent } from '../domain/sale'
import { DISCOUNT_REASONS } from '../types'
import type { DiscountReason } from '../types'

function centsToText(cents: number): string {
  const whole = Math.floor(cents / 100)
  const fraction = cents % 100
  return fraction ? `${whole},${String(fraction).padStart(2, '0')}` : String(whole)
}

export function DescuentoPage() {
  const api = useRegistroServicio()
  const navigate = useNavigate()
  const policy = getPolicy()
  const { service, specialist } = api
  const listCents = service.listPriceCents

  const [amount, setAmount] = useState(api.draft.discount ? centsToText(api.draft.discount.cents) : '')
  const [reason, setReason] = useState<DiscountReason | null>(api.draft.discount?.reason ?? null)
  const [detail, setDetail] = useState(api.draft.discount?.detail ?? '')
  const [showErrors, setShowErrors] = useState(false)

  const cents = parseAmountToCents(amount)
  const amountError =
    cents === null
      ? 'Escriba un importe válido, por ejemplo 8, 8,5 u 8,50.'
      : cents > listCents
        ? 'El descuento no puede superar el precio de lista.'
        : cents === 0
          ? 'El descuento debe ser mayor que cero.'
          : undefined
  const reasonError = reason === null ? 'Elija un motivo.' : undefined
  const preview = cents !== null && cents > 0 && cents <= listCents ? calculateSale({ listCents, discountCents: cents }, policy) : null

  function apply() {
    setShowErrors(true)
    if (amountError || reasonError || cents === null || reason === null) return
    api.setDiscount({ cents, reason, detail: detail.trim() })
    navigate(ROUTES.register)
  }

  function remove() {
    api.setDiscount(null)
    navigate(ROUTES.register)
  }

  return (
    <MobileScreen
      title="Descuento"
      backTo={ROUTES.register}
      footer={
        <>
          <Button block onClick={apply}>
            {preview?.exceedsLimit ? 'Solicitar aprobación' : 'Aplicar descuento'}
          </Button>
          {api.draft.discount ? (
            <Button variant="link" onClick={remove} style={{ alignSelf: 'center' }}>
              Quitar descuento
            </Button>
          ) : null}
        </>
      }
    >
      <div>
        <p className="eyebrow">
          {service.name} · {specialist.name}
        </p>
        <div className="line line--top" style={{ marginTop: 'var(--space-3)' }}>
          <span className="line__label">Precio de lista</span>
          <span className="line__value">{formatBs(listCents)}</span>
        </div>
      </div>
      <Field
        label="Descuento (Bs)"
        inputMode="decimal"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        hint="Acepta 8, 8,5 u 8,50."
        error={showErrors ? amountError : undefined}
      />
      <section aria-labelledby="sec-motivo">
        <p className="eyebrow" id="sec-motivo">
          Motivo
        </p>
        <div className="choice-row choice-row--2" style={{ marginTop: 'var(--space-3)' }}>
          {DISCOUNT_REASONS.map((item) => (
            <Choice key={item} pressed={reason === item} onSelect={() => setReason(item)}>
              {item}
            </Choice>
          ))}
        </div>
        {showErrors && reasonError ? (
          <p className="t-caption rouge" role="alert" style={{ marginTop: 'var(--space-2)' }}>
            Error: {reasonError}
          </p>
        ) : null}
      </section>
      <Field label="Detalle del motivo (opcional)" value={detail} onChange={(event) => setDetail(event.target.value)} />
      {preview ? (
        <Panel>
          <div className="line" style={{ paddingTop: 0 }}>
            <span className="line__label">Cobrado</span>
            <span className="line__value--md">{formatBs(preview.chargedCents)}</span>
          </div>
          <div className="line" style={{ paddingTop: 0 }}>
            <span className="line__label">Comisión {formatPercent(policy.commissionBps)} sobre lista</span>
            <span className="line__value--md">{formatBs(preview.commissionCents)}</span>
          </div>
          <p className="t-body">
            {preview.exceedsLimit
              ? `Descuento de ${formatPercent(preview.discountBps)}. Supera el límite de ${formatPercent(policy.maxDiscountBps)}: requiere la aprobación de la administradora.`
              : `Descuento de ${formatPercent(preview.discountBps)}. Está dentro del límite de ${formatPercent(policy.maxDiscountBps)}, así que no requiere aprobación.`}
          </p>
        </Panel>
      ) : null}
      <p className="t-caption">
        Los descuentos superiores a {formatPercent(policy.maxDiscountBps)} requieren la aprobación de la administradora.
        Límite ilustrativo.
      </p>
    </MobileScreen>
  )
}
