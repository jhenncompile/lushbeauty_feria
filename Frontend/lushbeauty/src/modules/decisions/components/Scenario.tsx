import { useState } from 'react'
import { formatBs, parseAmountToCents } from '../../../shared/money'
import { Field } from '../../../shared/ui'
import { simulate } from '../domain/simulation'
import type { ScenarioInput } from '../domain/simulation'
import { DEFAULT_SCENARIO } from '../fixtures'

interface Draft {
  list: string
  materials: string
  commission: string
  services: string
}

const INITIAL: Draft = { list: '120', materials: '20', commission: '35', services: '100' }

function parseScenario(draft: Draft): { input: ScenarioInput | null; errors: Partial<Record<keyof Draft, string>> } {
  const errors: Partial<Record<keyof Draft, string>> = {}
  const list = parseAmountToCents(draft.list)
  const materials = parseAmountToCents(draft.materials)
  const commission = parseAmountToCents(draft.commission)
  const services = /^\d+$/.test(draft.services.trim()) ? Number(draft.services) : null
  if (list === null || list === 0) errors.list = 'Escriba un precio de lista mayor que cero.'
  if (materials === null) errors.materials = 'Escriba un importe válido, por ejemplo 20 o 20,50.'
  if (commission === null || commission > 10000) errors.commission = 'Escriba un porcentaje entre 0 y 100.'
  if (services === null) errors.services = 'Escriba un número entero de servicios.'
  if (Object.keys(errors).length > 0) return { input: null, errors }
  return {
    input: {
      listCents: list!,
      materialsCents: materials!,
      // El porcentaje se escribe como «35» o «35,5»: los centavos de ese número son los puntos básicos.
      commissionBps: commission!,
      servicesPerWeek: services!,
    },
    errors,
  }
}

const money = (cents: number) => formatBs(cents, { decimals: cents % 100 === 0 ? 0 : 2 })

/** Formulario de supuestos y tabla de resultados del escenario. `web` usa la tabla ancha. */
export function Scenario({ web }: { web?: boolean }) {
  const [draft, setDraft] = useState<Draft>(INITIAL)
  const { input, errors } = parseScenario(draft)
  const rows = simulate(input ?? DEFAULT_SCENARIO)
  const update = (key: keyof Draft) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((current) => ({ ...current, [key]: event.target.value }))
  const services = input?.servicesPerWeek ?? DEFAULT_SCENARIO.servicesPerWeek
  const heads = web ? ['Mantener', 'Descuento 5 %', 'Descuento 10 %'] : rows.map((row) => row.label)
  const table = (
    <div className={web ? 'scroll' : undefined}>
      <table className={web ? 'tbl tbl--web' : 'tbl'} aria-label="Resultado por alternativa">
        <thead>
          <tr>
            <th className={web ? 'l' : undefined} scope="col">Por servicio</th>
            {heads.map((head) => (
              <th key={head} scope="col">{head}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr><td>Cobrado</td>{rows.map((r) => <td key={r.label}>{money(r.chargedCents)}</td>)}</tr>
          <tr><td>{web ? 'Comisión sobre lista' : 'Comisión'}</td>{rows.map((r) => <td key={r.label}>{money(r.commissionCents)}</td>)}</tr>
          <tr><td>Materiales</td>{rows.map((r) => <td key={r.label}>{money(r.materialsCents)}</td>)}</tr>
          <tr className="is-total"><td>Contribución</td>{rows.map((r) => <td key={r.label}>{money(r.contributionCents)}</td>)}</tr>
          <tr><td>Total con {services} servicios</td>{rows.map((r) => <td key={r.label}>{money(r.weeklyCents)}</td>)}</tr>
          <tr><td>Servicios para igualar</td>{rows.map((r) => <td key={r.label}>{r.servicesToMatch ?? '—'}</td>)}</tr>
        </tbody>
      </table>
    </div>
  )
  const fields = (
    <div
      className="grid"
      style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: web ? 'var(--space-3) var(--space-6)' : 'var(--space-2) var(--space-5)' }}
    >
      <Field label="Precio de lista (Bs)" inputMode="decimal" value={draft.list} onChange={update('list')} error={errors.list} />
      <Field label="Materiales (Bs)" inputMode="decimal" value={draft.materials} onChange={update('materials')} error={errors.materials} />
      <Field label="Comisión (%)" inputMode="decimal" value={draft.commission} onChange={update('commission')} error={errors.commission} />
      <Field label="Servicios por semana" inputMode="numeric" value={draft.services} onChange={update('services')} error={errors.services} />
    </div>
  )
  const caveat = input ? null : (
    <p className="t-caption rouge">Corrija los datos marcados: mientras tanto se muestran los valores de ejemplo.</p>
  )
  return web ? (
    <div className="cols">
      <div className="stack">{fields}{caveat}</div>
      {table}
    </div>
  ) : (
    <>
      {fields}
      {caveat}
      {table}
    </>
  )
}
