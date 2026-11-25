import { formatBs } from '../../../shared/money'
import { WebScreen } from '../../../shared/layout'
import { Button, Field, Stat, Tag } from '../../../shared/ui'
import { useCashClose } from '../cash'
import { LAST_CLOSES } from '../fixtures'
import { DiffText } from './DiffText'

export function WebCajaPage() {
  const cash = useCashClose()
  const result = cash.reconciliation
  return (
    <WebScreen>
      <div className="stack" style={{ gap: 'var(--space-2)' }}>
        <p className="eyebrow">{cash.date}</p>
        <h1 className="display-lg">Cierre de caja</h1>
      </div>
      <div className="cols cols--21">
        <section className="stack--lg stack">
          <div className="scroll">
            <table className="tbl tbl--web">
              <thead>
                <tr>
                  <th className="l" scope="col">Método</th>
                  <th scope="col">Esperado</th>
                  <th scope="col">Declarado</th>
                  <th scope="col">Diferencia</th>
                </tr>
              </thead>
              <tbody>
                {(result?.rows ?? []).map((row) => (
                  <tr key={row.method}>
                    <td>{row.method}</td>
                    <td>{formatBs(row.expectedCents)}</td>
                    <td>{formatBs(row.declaredCents)}</td>
                    <td>
                      <DiffText
                        cents={row.diffCents}
                        status={row.diffCents === 0 ? 'conciliado' : row.diffCents < 0 ? 'falta' : 'sobra'}
                      />
                    </td>
                  </tr>
                ))}
                {result ? (
                  <tr className="is-total">
                    <td>Total</td>
                    <td>{formatBs(result.expectedTotalCents)}</td>
                    <td>{formatBs(result.declaredTotalCents)}</td>
                    <td>
                      <DiffText cents={result.cashDiffCents} status={result.cashStatus} />
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
            {!result ? (
              <p className="t-caption" style={{ marginTop: 'var(--space-3)' }}>
                Cuente el efectivo para ver lo esperado y la diferencia.
              </p>
            ) : null}
          </div>
          <div className="grid">
            <Field
              label="Efectivo contado (Bs)"
              inputMode="decimal"
              value={cash.countedText}
              onChange={(event) => cash.setCountedText(event.target.value)}
              readOnly={cash.closed}
              error={cash.countedError}
            />
            <Field
              label="Justificación de la diferencia"
              value={cash.justification}
              onChange={(event) => cash.setJustification(event.target.value)}
              readOnly={cash.closed}
              hint="Obligatoria cuando hay diferencia."
              error={cash.justificationError}
            />
          </div>
          <div className="row">
            {cash.closed ? (
              <Tag tone="ok">Caja cerrada</Tag>
            ) : (
              <Button onClick={() => cash.close()} disabled={!cash.canClose}>
                Cerrar caja
              </Button>
            )}
            <span className="t-caption">
              {cash.closed || cash.canClose
                ? 'El cierre final se registra en línea. Cualquier cambio posterior deja historial.'
                : 'El cierre de caja requiere conexión.'}
            </span>
          </div>
        </section>
        <aside className="stack--lg stack">
          {result ? (
            <Stat
              label="Diferencia en efectivo"
              value={result.cashDiffCents > 0 ? `+ ${formatBs(result.cashDiffCents)}` : formatBs(result.cashDiffCents)}
              delta={
                result.cashStatus === 'conciliado'
                  ? 'Conciliado: el efectivo cuadra'
                  : result.cashStatus === 'falta'
                    ? `Falta ${formatBs(-result.cashDiffCents)} en efectivo`
                    : `Sobra ${formatBs(result.cashDiffCents)} en efectivo`
              }
              tone={result.cashStatus === 'conciliado' ? 'up' : result.cashStatus === 'falta' ? 'down' : 'neutral'}
              note="Ilustrativo"
            />
          ) : null}
          <section>
            <p className="eyebrow">Últimos cierres</p>
            <div style={{ marginTop: 'var(--space-2)' }}>
              {LAST_CLOSES.map((item, index) => (
                <div className={index === 0 ? 'line line--top' : 'line'} key={item.id}>
                  <div>
                    <p className="t-body">{item.date}</p>
                    <p className="t-caption">{item.note}</p>
                  </div>
                  <Tag tone={item.tone}>{item.tag}</Tag>
                </div>
              ))}
            </div>
            <p className="t-caption" style={{ marginTop: 'var(--space-2)' }}>Ilustrativo</p>
          </section>
        </aside>
      </div>
    </WebScreen>
  )
}
