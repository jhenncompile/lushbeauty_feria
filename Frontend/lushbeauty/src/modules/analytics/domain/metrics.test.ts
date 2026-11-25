import { describe, expect, it } from 'vitest'
import { oneDecimalPercent, wholePercent } from './metrics'

describe('porcentajes enteros para barras', () => {
  it('Efectivo 1.236 de 2.206 es 56 %', () => {
    expect(wholePercent(123600, 220600)).toBe(56)
    expect(wholePercent(70000, 220600)).toBe(32)
    expect(wholePercent(27000, 220600)).toBe(12)
  })

  it('un total en cero no divide por cero', () => {
    expect(wholePercent(100, 0)).toBe(0)
  })
})

describe('oneDecimalPercent', () => {
  it('descuentos 114 de 2.320 es 4,9 %', () => {
    expect(oneDecimalPercent(11400, 232000)).toBe('4,9 %')
  })

  it('omite ,0', () => {
    expect(oneDecimalPercent(1000, 10000)).toBe('10 %')
  })
})
