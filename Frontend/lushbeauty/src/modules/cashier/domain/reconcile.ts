/** Conciliación de caja en centavos. Solo el efectivo se cuenta a mano. */

export interface ExpectedByMethod {
  method: string
  cents: number
}

export type CashStatus = 'conciliado' | 'falta' | 'sobra'

export interface ReconcileRow {
  method: string
  expectedCents: number
  declaredCents: number
  diffCents: number
}

export interface Reconciliation {
  rows: ReconcileRow[]
  expectedTotalCents: number
  declaredTotalCents: number
  cashDiffCents: number
  cashStatus: CashStatus
}

export function reconcile(expected: ExpectedByMethod[], countedCashCents: number): Reconciliation {
  const rows = expected.map((item) => {
    const declaredCents = item.method === 'Efectivo' ? countedCashCents : item.cents
    return { method: item.method, expectedCents: item.cents, declaredCents, diffCents: declaredCents - item.cents }
  })
  const cashDiffCents = rows.find((row) => row.method === 'Efectivo')?.diffCents ?? 0
  return {
    rows,
    expectedTotalCents: rows.reduce((sum, row) => sum + row.expectedCents, 0),
    declaredTotalCents: rows.reduce((sum, row) => sum + row.declaredCents, 0),
    cashDiffCents,
    cashStatus: cashDiffCents === 0 ? 'conciliado' : cashDiffCents < 0 ? 'falta' : 'sobra',
  }
}

export function requiresJustification(diffCents: number): boolean {
  return diffCents !== 0
}
