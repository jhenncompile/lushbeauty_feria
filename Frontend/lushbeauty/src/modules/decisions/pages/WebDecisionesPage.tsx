import { formatBs } from '../../../shared/money'
import { WebScreen } from '../../../shared/layout'
import { Button, Tag } from '../../../shared/ui'
import { MatrixTable, Sensitivity, WeightsCheck } from '../components/Matrix'
import { AssumptionList } from '../components/Recommendation'
import { recommendation } from '../domain/recommendation'
import { Scenario } from '../components/Scenario'
import { CONTRIBUTIONS, DECISIONS } from '../fixtures'

function Heading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="stack" style={{ gap: 'var(--space-2)' }}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="t-headline">{title}</h2>
    </div>
  )
}

export function WebDecisionesPage() {
  const { headline, reason } = recommendation()
  return (
    <WebScreen>
      <div className="stack" style={{ gap: 'var(--space-9)' }}>
        <div className="stack" style={{ gap: 'var(--space-2)' }}>
          <p className="eyebrow">Lush Decision Studio</p>
          <h1 className="display-lg">Decisiones</h1>
          <p className="t-body muted measure">
            Compare alternativas con escenarios hipotéticos. Nada de lo que simule modifica ventas, nóminas ni
            políticas de comisión.
          </p>
        </div>

        <section className="stack--lg stack" aria-label="Contribución por servicio">
          <Heading eyebrow="1 · Contribución por servicio" title="Qué deja cada servicio" />
          <div className="scroll">
            <table className="tbl tbl--web">
              <thead>
                <tr>
                  <th className="l" scope="col">Servicio</th>
                  <th scope="col">Cobrado</th>
                  <th scope="col">Comisión</th>
                  <th scope="col">Materiales</th>
                  <th scope="col">Contribución</th>
                </tr>
              </thead>
              <tbody>
                {CONTRIBUTIONS.map((row) => (
                  <tr key={row.service}>
                    <td>{row.service}</td>
                    <td>{formatBs(row.chargedCents)}</td>
                    <td>{formatBs(row.commissionCents)}</td>
                    {row.materialsCents === null ? (
                      <>
                        <td className="rouge">Sin costo registrado</td>
                        <td>Datos insuficientes</td>
                      </>
                    ) : (
                      <>
                        <td>{formatBs(row.materialsCents)}</td>
                        <td>{formatBs(row.chargedCents - row.commissionCents - row.materialsCents)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="t-caption" style={{ marginTop: 'var(--space-3)' }}>
              Ilustrativo. Sin costos registrados no se calcula la contribución: el sistema no estima por su cuenta.
            </p>
          </div>
        </section>

        <section className="stack--lg stack" aria-label="Simulación What-If">
          <Heading eyebrow="2 · Simulación What-If" title="Descuento en Manicura gel" />
          <Scenario web />
          <p className="t-caption">Escenario hipotético e ilustrativo. Los volúmenes son supuestos.</p>
        </section>

        <section className="stack--lg stack" aria-label="Comparación multicriterio">
          <Heading eyebrow="3 · Comparación multicriterio" title="Tres alternativas, tres criterios" />
          <div className="cols">
            <div className="scroll">
              <MatrixTable web />
              <div style={{ marginTop: 'var(--space-3)' }}><WeightsCheck /></div>
            </div>
            <div className="stack">
              <p className="eyebrow">Sensibilidad</p>
              <Sensitivity web />
            </div>
          </div>
          <p className="t-caption">
            Los puntajes de atracción y simplicidad son supuestos de la administradora, de 0 a 10. Ilustrativo.
          </p>
        </section>

        <section className="stack--lg stack" aria-label="Recomendación">
          <Heading eyebrow="4 · Recomendación" title="Qué sugiere Lush Insight" />
          <div className="panel" style={{ padding: 'var(--space-7)' }}>
            <div className="cols">
              <div className="stack">
                <p className="eyebrow">Lush Insight sugiere</p>
                <h3 className="display-lg">{headline}</h3>
                <p className="t-body muted">
                  {reason} Si la atracción de clientas pesa 50&thinsp;% o más, el descuento de 10&thinsp;% pasa a ser la
                  mejor opción.
                </p>
                <p className="t-caption">No se informa utilidad neta: faltan los costos fijos. La decisión es de la administradora.</p>
                <div className="row">
                  <Button>Aprobar</Button>
                  <Button variant="secondary">Descartar</Button>
                </div>
              </div>
              <div>
                <p className="eyebrow">Supuestos</p>
                <div style={{ marginTop: 'var(--space-2)' }}><AssumptionList /></div>
              </div>
            </div>
          </div>
        </section>

        <section className="stack--lg stack" aria-label="Historial">
          <Heading eyebrow="5 · Historial" title="Decisiones registradas" />
          <div className="scroll">
            <table className="tbl tbl--web">
              <thead>
                <tr>
                  <th className="l" scope="col">Código</th>
                  <th className="l" scope="col">Decisión</th>
                  <th className="l" scope="col">Responsable</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Resultado esperado</th>
                  <th className="l" scope="col">Revisión posterior</th>
                  <th className="l" scope="col">Estado</th>
                </tr>
              </thead>
              <tbody>
                {DECISIONS.map((d) => (
                  <tr key={d.code}>
                    <td>{d.code}</td>
                    <td className="l">{d.title}</td>
                    <td className="l">{d.owner}</td>
                    <td>{d.date}</td>
                    <td>{d.expected}</td>
                    <td className="l">{d.review}</td>
                    <td className="l"><Tag tone="ok">{d.status}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="t-caption" style={{ marginTop: 'var(--space-3)' }}>
              Cifra ilustrativa. El historial conserva el escenario original; la revisión posterior no lo reescribe.
            </p>
          </div>
        </section>
      </div>
    </WebScreen>
  )
}
