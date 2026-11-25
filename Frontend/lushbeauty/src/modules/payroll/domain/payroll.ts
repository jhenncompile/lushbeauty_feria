/** Reglas puras de liquidación, en centavos enteros. */

export interface LineAmounts {
  listCents: number
  discountCents: number
}

export interface PayAmounts {
  commissionCents: number
  tipsCents: number
  deductionsCents: number
}

function roundDiv(numerator: number, denominator: number): number {
  return Math.floor((numerator * 2 + denominator) / (denominator * 2))
}

/** Comisión línea por línea sobre el precio de lista (redondeo provisional: decisión abierta 1). */
export function commissionOnList(lines: LineAmounts[], bps: number): number {
  return lines.reduce((sum, line) => sum + roundDiv(line.listCents * bps, 10000), 0)
}

/** Comisión línea por línea sobre el importe cobrado (simulación de política alternativa). */
export function commissionOnCharged(lines: LineAmounts[], bps: number): number {
  return lines.reduce((sum, line) => sum + roundDiv((line.listCents - line.discountCents) * bps, 10000), 0)
}

export function netPay(pay: PayAmounts): number {
  return pay.commissionCents + pay.tipsCents - pay.deductionsCents
}

export function totals(rows: PayAmounts[]): PayAmounts & { netCents: number } {
  const sum = rows.reduce(
    (acc, row) => ({
      commissionCents: acc.commissionCents + row.commissionCents,
      tipsCents: acc.tipsCents + row.tipsCents,
      deductionsCents: acc.deductionsCents + row.deductionsCents,
    }),
    { commissionCents: 0, tipsCents: 0, deductionsCents: 0 },
  )
  return { ...sum, netCents: netPay(sum) }
}
