import { useState } from 'react'
import { formatBs } from '../../../shared/money'
import { ROUTES, WebScreen } from '../../../shared/layout'
import { Button, Field, Panel, Tag } from '../../../shared/ui'
import { getPolicy } from '../../catalog'
import { calculateSale, formatPercent } from '../domain/sale'
import { WEB_SALES } from '../fixtures'
import type { SaleRow, SaleStatus } from '../types'

const STATUS_LABEL: Record<SaleStatus, { text: string; tone?: 'ok' | 'rouge' }> = {
  confirmada: { text: 'Confirmada', tone: 'ok' },
  revision: { text: 'Requiere revisión', tone: 'rouge' },
  alerta: { text: 'Con alerta', tone: 'rouge' },
  anulada: { text: 'Anulada' },
}

type StatusFilter = 'todos' | SaleStatus

export function WebVentasPage() {
  const policy = getPolicy()
  const [rows, setRows] = useState<SaleRow[]>(WEB_SALES)
  const [filter, setFilter] = useState<StatusFilter>('todos')
  const [selectedId, setSelectedId] = useState(WEB_SALES[0].id)
  const [cancelling, setCancelling] = useState(false)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState<string>()

  const visible = rows.filter((row) => filter === 'todos' || row.status === filter)
  const selected = rows.find((row) => row.id === selectedId) ?? rows[0]
  const calc = calculateSale({ listCents: selected.listCents, discountCents: selected.discountCents }, policy)

  function select(id: string) {
    setSelectedId(id)
    setCancelling(false)
    setReason('')
    setReasonError(undefined)
  }

  function confirmCancel() {
    if (!reason.trim()) {
      setReasonError('Escriba el motivo de la anulación.')
      return
    }
    // Nada se borra: la fila se conserva con estado «Anulada» y, con backend, genera un ajuste (F01-T3).
    setRows((current) => current.map((row) => (row.id === selected.id ? { ...row, status: 'anulada' } : row)))
    setCancelling(false)
    setReason('')
  }

  return (
    <WebScreen>
      <div className="row row--between">
        <div className="stack" style={{ gap: 'var(--space-2)' }}>
          <p className="eyebrow">Registro de servicios</p>
          <h1 className="display-lg">Ventas</h1>
        </div>
        <Button to={ROUTES.register}>Registrar servicio</Button>
      </div>
      <div className="toolbar">
        <div>
          <label className="eyebrow" htmlFor="per">
            Período
          </label>
          <select className="sel" id="per" defaultValue="s17">
            <option value="s17">Semana 17 – 23 nov 2026</option>
          </select>
        </div>
        <div>
          <label className="eyebrow" htmlFor="est">
            Estado
          </label>
          <select className="sel" id="est" value={filter} onChange={(event) => setFilter(event.target.value as StatusFilter)}>
            <option value="todos">Todos</option>
            <option value="revision">Requiere revisión</option>
            <option value="alerta">Con alerta</option>
            <option value="anulada">Anulada</option>
          </select>
        </div>
      </div>
      <div className="cols cols--21">
        <div className="scroll">
          <table className="tbl tbl--web">
            <thead>
              <tr>
                <th className="l" scope="col">Fecha</th>
                <th className="l" scope="col">Servicio</th>
                <th className="l" scope="col">Especialista</th>
                <th className="l" scope="col">Método</th>
                <th scope="col">Lista</th>
                <th scope="col">Descuento</th>
                <th scope="col">Cobrado</th>
                <th scope="col">Comisión</th>
                <th className="l" scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => {
                const result = calculateSale({ listCents: row.listCents, discountCents: row.discountCents }, policy)
                const status = STATUS_LABEL[row.status]
                return (
                  <tr key={row.id}>
                    <td>{row.date}</td>
                    <td className="l">
                      <button
                        type="button"
                        className="lb-btn lb-btn--link"
                        aria-pressed={row.id === selected.id}
                        onClick={() => select(row.id)}
                      >
                        {row.serviceName}
                      </button>
                    </td>
                    <td className="l">{row.specialistName}</td>
                    <td className={row.method ? 'l' : 'l rouge'}>{row.method ?? 'Sin confirmar'}</td>
                    <td>{formatBs(row.listCents, { decimals: 0 })}</td>
                    <td>{formatBs(row.discountCents, { decimals: 0 })}</td>
                    <td>{formatBs(result.chargedCents, { decimals: 0 })}</td>
                    <td>{formatBs(result.commissionCents)}</td>
                    <td className="l">
                      <Tag tone={status.tone}>{status.text}</Tag>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <p className="t-caption" style={{ marginTop: 'var(--space-3)' }}>
            Cifras ilustrativas. Las ventas anuladas conservan su fila y generan un ajuste.
          </p>
        </div>
        <aside className="panel" aria-label="Venta seleccionada">
          <p className="eyebrow">Venta seleccionada</p>
          <h2 className="t-headline">
            {selected.serviceName} · {selected.specialistName}
          </h2>
          <div>
            <div className="line" style={{ paddingTop: 0 }}>
              <span className="line__label">Precio de lista</span>
              <span className="line__value--md">{formatBs(calc.listCents)}</span>
            </div>
            {calc.discountCents > 0 ? (
              <div className="line" style={{ paddingTop: 0 }}>
                <span className="line__label">Descuento · {selected.discountReason}</span>
                <span className="line__value--md rouge">{formatBs(-calc.discountCents)}</span>
              </div>
            ) : null}
            <div className="line" style={{ paddingTop: 0 }}>
              <span className="line__label">Cobrado · {selected.method ?? 'Sin confirmar'}</span>
              <span className="line__value--md">{formatBs(calc.chargedCents)}</span>
            </div>
            <div className="line" style={{ paddingTop: 0, borderBottom: 0 }}>
              <span className="line__label">Comisión {formatPercent(policy.commissionBps)} sobre lista</span>
              <span className="line__value--md">{formatBs(calc.commissionCents)}</span>
            </div>
          </div>
          <p className="t-caption">
            Copia inmutable de la venta: un cambio posterior del catálogo o de la comisión no la recalcula. Registrada
            el {selected.registeredAt}.
          </p>
          {selected.status === 'anulada' ? (
            <Tag>Anulada · ajuste registrado</Tag>
          ) : cancelling ? (
            <Panel>
              <Field
                label="Motivo de la anulación"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                error={reasonError}
              />
              <Button variant="danger" onClick={confirmCancel}>
                Confirmar anulación
              </Button>
              <Button variant="link" onClick={() => setCancelling(false)}>
                No anular
              </Button>
            </Panel>
          ) : (
            <Button variant="danger" onClick={() => setCancelling(true)}>
              Anular servicio de {formatBs(calc.chargedCents, { decimals: calc.chargedCents % 100 ? 2 : 0 })}
            </Button>
          )}
        </aside>
      </div>
    </WebScreen>
  )
}
