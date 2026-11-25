import { describe, expect, it } from 'vitest'
import { calculateSale, formatPercent } from './sale'

const POLICY = { commissionBps: 3500, maxDiscountBps: 1000 }

describe('calculateSale (CP-01: lista Bs 120, descuento Bs 8)', () => {
  it('cobra 112, conserva la lista y calcula comisión sobre lista', () => {
    const sale = calculateSale({ listCents: 12000, discountCents: 800 }, POLICY)
    expect(sale.chargedCents).toBe(11200)
    expect(sale.listCents).toBe(12000)
    expect(sale.commissionCents).toBe(4200)
    expect(sale.exceedsLimit).toBe(false)
  })

  it('sin descuento cobra la lista', () => {
    const sale = calculateSale({ listCents: 10000, discountCents: 0 }, POLICY)
    expect(sale.chargedCents).toBe(10000)
    expect(sale.commissionCents).toBe(3500)
  })

  it('el límite exacto del 10 % no requiere aprobación; un centavo más sí', () => {
    expect(calculateSale({ listCents: 12000, discountCents: 1200 }, POLICY).exceedsLimit).toBe(false)
    expect(calculateSale({ listCents: 12000, discountCents: 1201 }, POLICY).exceedsLimit).toBe(true)
  })

  it('rechaza un descuento mayor que la lista o negativo', () => {
    expect(() => calculateSale({ listCents: 12000, discountCents: 12001 }, POLICY)).toThrow()
    expect(() => calculateSale({ listCents: 12000, discountCents: -1 }, POLICY)).toThrow()
  })

  it('devuelve el porcentaje en puntos básicos', () => {
    expect(calculateSale({ listCents: 12000, discountCents: 800 }, POLICY).discountBps).toBe(667)
  })
})

describe('formatPercent', () => {
  it('muestra un decimal con coma y omite ,0', () => {
    expect(formatPercent(667)).toBe('6,7 %')
    expect(formatPercent(1000)).toBe('10 %')
    expect(formatPercent(3500)).toBe('35 %')
    expect(formatPercent(1500)).toBe('15 %')
  })
})
