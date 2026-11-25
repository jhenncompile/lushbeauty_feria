import { describe, expect, it } from 'vitest'
import { commissionOnCharged, commissionOnList, netPay, totals } from './payroll'

const PATY = [
  { listCents: 12000, discountCents: 800 },
  { listCents: 10000, discountCents: 0 },
  { listCents: 6000, discountCents: 0 },
  { listCents: 18000, discountCents: 1000 },
]

describe('comisión por línea', () => {
  it('sobre lista suma 161,00 para las 4 líneas de Paty', () => {
    expect(commissionOnList(PATY, 3500)).toBe(16100)
  })

  it('sobre importe cobrado suma 154,70 y la diferencia es 6,30', () => {
    expect(commissionOnCharged(PATY, 3500)).toBe(15470)
    expect(commissionOnList(PATY, 3500) - commissionOnCharged(PATY, 3500)).toBe(630)
  })
})

describe('netPay', () => {
  it('comisión + propinas − deducciones', () => {
    expect(netPay({ commissionCents: 16100, tipsCents: 1500, deductionsCents: 3000 })).toBe(14600)
  })

  it('puede quedar en cero pero nunca se oculta un negativo', () => {
    expect(netPay({ commissionCents: 1000, tipsCents: 0, deductionsCents: 3000 })).toBe(-2000)
  })
})

describe('totals', () => {
  it('suma por columna y el neto total es la suma de los netos', () => {
    const rows = [
      { commissionCents: 16100, tipsCents: 1500, deductionsCents: 3000 },
      { commissionCents: 11200, tipsCents: 0, deductionsCents: 0 },
      { commissionCents: 53900, tipsCents: 2000, deductionsCents: 0 },
    ]
    expect(totals(rows)).toEqual({ commissionCents: 81200, tipsCents: 3500, deductionsCents: 3000, netCents: 81700 })
  })
})
