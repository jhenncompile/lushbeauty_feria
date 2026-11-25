import { Link } from 'react-router-dom'
import { formatBs } from '../../../shared/money'
import { ROUTES, WebScreen } from '../../../shared/layout'
import { ART, Stat, Tag } from '../../../shared/ui'
import { oneDecimalPercent, wholePercent } from '../domain/metrics'
import { BY_METHOD, BY_SPECIALIST, PERIOD, SUMMARY } from '../fixtures'

export function WebPanelPage() {
  const sum = (key: 'grossCents' | 'discountCents' | 'commissionCents') =>
    BY_SPECIALIST.reduce((total, row) => total + row[key], 0)
  const methodsTotal = BY_METHOD.reduce((total, row) => total + row.cents, 0)
  return (
    <WebScreen>
      <div className="masthead noir" style={{ marginInline: 'calc(var(--space-7) * -1)', paddingInline: 'var(--space-7)' }}>
        <img className="masthead__plate" src={ART.contour} alt="" aria-hidden="true" />
        <div className="masthead__in">
          <p className="eyebrow">{PERIOD}</p>
          <h1 className="display-xl">Panel financiero</h1>
          <p className="body-lg muted">Cobrado, comisionado y por pagar, a la vista.</p>
        </div>
      </div>
      <section className="stack" aria-label="Resumen">
        <div className="grid grid--3">
          <Stat label="Ventas brutas" value={formatBs(SUMMARY.grossCents, { decimals: 0 })} delta={`${SUMMARY.servicesCount} servicios`} note="Ilustrativo" />
          <Stat label="Cobrado neto" value={formatBs(SUMMARY.netCents, { decimals: 0 })} delta="Efectivo, QR y transferencia" note="Ilustrativo" />
          <Stat
            label="Descuentos"
            value={formatBs(SUMMARY.discountsCents, { decimals: 0 })}
            delta={`${oneDecimalPercent(SUMMARY.discountsCents, SUMMARY.grossCents)} del bruto`}
            note="Ilustrativo"
          />
        </div>
        <div className="grid grid--3">
          <Stat label="Comisiones estimadas" value={formatBs(SUMMARY.commissionsCents)} delta="35 % sobre lista" note="Ilustrativo" />
          <Stat label="Propinas" value={formatBs(SUMMARY.tipsCents)} note="Ilustrativo" />
          <Stat
            label="Cierres pendientes"
            value={String(SUMMARY.pendingCloses)}
            delta="Falta cerrar el 23 nov"
            tone="down"
          />
        </div>
        <p className="t-caption">El cobrado neto no incluye registros por confirmar.</p>
      </section>
      <div className="cols cols--21">
        <div className="stack--lg stack">
          <section aria-labelledby="sec-metodo">
            <p className="eyebrow" id="sec-metodo">
              Cobrado por método de pago
            </p>
            <div style={{ marginTop: 'var(--space-3)', borderTop: '1px solid var(--ink)' }}>
              {BY_METHOD.map((row) => (
                <div className="bar-row" key={row.method}>
                  <span className="t-body">{row.method}</span>
                  <div className="bar-track" aria-hidden="true">
                    <div className="bar-fill" style={{ width: `${wholePercent(row.cents, methodsTotal)}%` }} />
                  </div>
                  <span className="line__value--md">{formatBs(row.cents, { decimals: 0 })}</span>
                </div>
              ))}
            </div>
          </section>
          <section aria-labelledby="sec-especialista">
            <p className="eyebrow" id="sec-especialista">
              Por especialista
            </p>
            <div className="scroll" style={{ marginTop: 'var(--space-3)' }}>
              <table className="tbl tbl--web">
                <thead>
                  <tr>
                    <th className="l" scope="col">Especialista</th>
                    <th scope="col">Servicios</th>
                    <th scope="col">Bruto</th>
                    <th scope="col">Descuento</th>
                    <th scope="col">Cobrado</th>
                    <th scope="col">Comisión</th>
                  </tr>
                </thead>
                <tbody>
                  {BY_SPECIALIST.map((row) => (
                    <tr key={row.name}>
                      <td>{row.name}</td>
                      <td>{row.services}</td>
                      <td>{formatBs(row.grossCents, { decimals: 0 })}</td>
                      <td>{formatBs(row.discountCents, { decimals: 0 })}</td>
                      <td>{formatBs(row.grossCents - row.discountCents, { decimals: 0 })}</td>
                      <td>{formatBs(row.commissionCents)}</td>
                    </tr>
                  ))}
                  <tr className="is-total">
                    <td>Total</td>
                    <td>{BY_SPECIALIST.reduce((total, row) => total + row.services, 0)}</td>
                    <td>{formatBs(sum('grossCents'), { decimals: 0 })}</td>
                    <td>{formatBs(sum('discountCents'), { decimals: 0 })}</td>
                    <td>{formatBs(sum('grossCents') - sum('discountCents'), { decimals: 0 })}</td>
                    <td>{formatBs(sum('commissionCents'))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <aside className="stack--lg stack">
          <section>
            <p className="eyebrow">Requiere atención</p>
            <Link className="line line--link" style={{ marginTop: 'var(--space-2)' }} to={ROUTES.webCash}>
              <span className="line__label">Cierre del 23 nov</span>
              <Tag tone="rouge">Falta Bs 10</Tag>
            </Link>
            <Link className="line line--link" to={ROUTES.webSales}>
              <span className="line__label">1 venta requiere revisión</span>
              <Tag tone="rouge">Bs 40</Tag>
            </Link>
          </section>
          <section>
            <p className="eyebrow">Herramientas</p>
            <Link className="line line--link" style={{ marginTop: 'var(--space-2)' }} to={ROUTES.webCatalog}>
              <span className="line__label">Catálogo y reglas</span>
            </Link>
          </section>
        </aside>
      </div>
    </WebScreen>
  )
}
