/** Simulación What-If de un descuento. Reglas puras, centavos enteros, sin React ni red. */

export interface ScenarioInput {
  listCents: number
  materialsCents: number
  /** Comisión sobre precio de lista, en puntos básicos (35 % = 3500). */
  commissionBps: number
  servicesPerWeek: number
}

export interface Alternative {
  label: string
  discountBps: number
}

export interface AlternativeResult {
  label: string
  chargedCents: number
  commissionCents: number
  materialsCents: number
  contributionCents: number
  weeklyCents: number
  /** Servicios por semana que igualan el total de «Mantener»; null en la propia base o si no se puede igualar. */
  servicesToMatch: number | null
}

export const ALTERNATIVES: Alternative[] = [
  { label: 'Mantener', discountBps: 0 },
  { label: '5 %', discountBps: 500 },
  { label: '10 %', discountBps: 1000 },
]

function roundDiv(numerator: number, denominator: number): number {
  return Math.floor((numerator * 2 + denominator) / (denominator * 2))
}

function ceilDiv(numerator: number, denominator: number): number {
  return Math.ceil(numerator / denominator)
}

export function simulate(input: ScenarioInput, alternatives: Alternative[] = ALTERNATIVES): AlternativeResult[] {
  const { listCents, materialsCents, commissionBps, servicesPerWeek } = input
  const values = [listCents, materialsCents, commissionBps, servicesPerWeek]
  if (!values.every((value) => Number.isInteger(value) && value >= 0)) {
    throw new RangeError('Los datos del escenario deben ser enteros no negativos')
  }
  // Redondeo provisional (mitad hacia arriba): la regla real es la decisión abierta 1 (RN-03).
  const commissionCents = roundDiv(listCents * commissionBps, 10000)
  const rows = alternatives.map((alternative) => {
    const chargedCents = listCents - roundDiv(listCents * alternative.discountBps, 10000)
    const contributionCents = chargedCents - commissionCents - materialsCents
    return {
      label: alternative.label,
      chargedCents,
      commissionCents,
      materialsCents,
      contributionCents,
      weeklyCents: contributionCents * servicesPerWeek,
      servicesToMatch: null as number | null,
    }
  })
  const base = rows[0]
  return rows.map((row, index) => ({
    ...row,
    servicesToMatch:
      index === 0 || row.contributionCents <= 0 || base.weeklyCents <= 0
        ? null
        : ceilDiv(base.weeklyCents, row.contributionCents),
  }))
}
