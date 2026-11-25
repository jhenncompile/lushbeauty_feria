import { bestIndex, formatTenths, weightedTenths, weightsTotal } from '../domain/matrix'
import { ALTERNATIVE_LABELS, CRITERIA, SENSITIVITY_WEIGHTS } from '../fixtures'
import { Tag } from '../../../shared/ui'

/** Tabla de criterios con su puntaje ponderado. */
export function MatrixTable({ web }: { web?: boolean }) {
  const current = weightedTenths(CRITERIA)
  return (
    <table className={web ? 'tbl tbl--web' : 'tbl'} aria-label="Matriz multicriterio">
      <thead>
        <tr>
          <th className={web ? 'l' : undefined} scope="col">Criterio · peso</th>
          {ALTERNATIVE_LABELS.map((label) => (
            <th key={label} scope="col">{label}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {CRITERIA.map((criterion) => (
          <tr key={criterion.id}>
            <td>{criterion.name} · {criterion.weightPct}&thinsp;%</td>
            {criterion.scores.map((score, index) => (
              <td key={index}>{score}</td>
            ))}
          </tr>
        ))}
        <tr className="is-total">
          <td>Puntaje</td>
          {current.map((value, index) => (
            <td key={index}>{formatTenths(value)}</td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}

export function WeightsCheck() {
  const total = weightsTotal(CRITERIA)
  const ok = total === 100
  return (
    <div className="line" style={{ borderBottom: 0, padding: 0 }}>
      <span className="t-caption">{CRITERIA.map((c) => c.weightPct).join(' + ')} = {total}&thinsp;%</span>
      <Tag tone={ok ? 'ok' : 'rouge'}>{ok ? 'Pesos suman 100 %' : `Los pesos suman ${total} %: deben sumar 100 %`}</Tag>
    </div>
  )
}

/** Cómo cambia el puntaje si la atracción de clientas pasa a pesar 50 %. */
export function Sensitivity({ web }: { web?: boolean }) {
  const current = weightedTenths(CRITERIA)
  const shifted = weightedTenths(CRITERIA, SENSITIVITY_WEIGHTS)
  const changes = bestIndex(current) !== bestIndex(shifted)
  return (
    <>
      <p className="t-body">
        Si la atracción de clientas pesa 50&thinsp;% y la contribución 30&thinsp;%,{' '}
        {changes ? 'la alternativa preferida cambia.' : 'la alternativa preferida no cambia.'}
      </p>
      <table className={web ? 'tbl tbl--web' : 'tbl'} aria-label="Sensibilidad de los pesos">
        <thead>
          <tr>
            <th className={web ? 'l' : undefined} scope="col">Pesos</th>
            {ALTERNATIVE_LABELS.map((label) => (
              <th key={label} scope="col">{label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Actuales</td>
            {current.map((value, index) => (
              <td key={index}>{formatTenths(value)}</td>
            ))}
          </tr>
          <tr className="is-total">
            <td>Atracción 50&thinsp;%</td>
            {shifted.map((value, index) => (
              <td key={index}>{formatTenths(value)}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </>
  )
}
