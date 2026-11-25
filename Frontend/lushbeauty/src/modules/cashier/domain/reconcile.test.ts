import { describe, expect, it } from 'vitest'
import { reconcile, requiresJustification } from './reconcile'

const EXPECTED = [
  { method: 'Efectivo', cents: 41200 },
  { method: 'QR', cents: 20000 },
  { method: 'Transferencia', cents: 8000 },
]

describe('reconcile', () => {
  it('efectivo contado 402 contra 412: falta Bs 10 y el total declarado es 682', () => {
    const result = reconcile(EXPECTED, 40200)
    expect(result.cashDiffCents).toBe(-1000)
    expect(result.expectedTotalCents).toBe(69200)
    expect(result.declaredTotalCents).toBe(68200)
    expect(result.cashStatus).toBe('falta')
    expect(result.rows.find((row) => row.method === 'Efectivo')?.diffCents).toBe(-1000)
  })

  it('cuadra cuando el contado es igual al esperado', () => {
    const result = reconcile(EXPECTED, 41200)
    expect(result.cashStatus).toBe('conciliado')
    expect(result.cashDiffCents).toBe(0)
  })

  it('sobra cuando el contado supera lo esperado', () => {
    const result = reconcile(EXPECTED, 41700)
    expect(result.cashStatus).toBe('sobra')
    expect(result.cashDiffCents).toBe(500)
  })

  it('los métodos no contados se toman iguales a lo esperado', () => {
    const result = reconcile(EXPECTED, 40200)
    expect(result.rows.filter((row) => row.method !== 'Efectivo').every((row) => row.diffCents === 0)).toBe(true)
  })
})

describe('requiresJustification', () => {
  it('solo cuando hay diferencia', () => {
    expect(requiresJustification(0)).toBe(false)
    expect(requiresJustification(-1)).toBe(true)
    expect(requiresJustification(1)).toBe(true)
  })
})
