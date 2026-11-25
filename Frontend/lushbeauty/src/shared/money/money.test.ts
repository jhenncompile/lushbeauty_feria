import { describe, expect, it } from 'vitest'
import { formatBs, parseAmountToCents } from './money'

describe('formatBs', () => {
  it('formatea con dos decimales y coma', () => {
    expect(formatBs(11200)).toBe('Bs 112,00')
    expect(formatBs(4200)).toBe('Bs 42,00')
  })

  it('agrupa miles con punto', () => {
    expect(formatBs(123600, { decimals: 0 })).toBe('Bs 1.236')
    expect(formatBs(401170)).toBe('Bs 4.011,70')
  })

  it('muestra el signo negativo con el menos tipográfico', () => {
    expect(formatBs(-1000)).toBe('− Bs 10,00')
  })

  it('no pierde centavos al omitir decimales solo si son cero', () => {
    expect(formatBs(11250, { decimals: 0 })).toBe('Bs 112,50')
    expect(formatBs(11200, { decimals: 0 })).toBe('Bs 112')
  })
})

describe('parseAmountToCents', () => {
  it('acepta 8, 8,5 y 8,50', () => {
    expect(parseAmountToCents('8')).toBe(800)
    expect(parseAmountToCents('8,5')).toBe(850)
    expect(parseAmountToCents('8,50')).toBe(850)
  })

  it('acepta punto decimal', () => {
    expect(parseAmountToCents('8.5')).toBe(850)
  })

  it('rechaza vacío, negativos, texto y más de 2 decimales', () => {
    expect(parseAmountToCents('')).toBeNull()
    expect(parseAmountToCents('-8')).toBeNull()
    expect(parseAmountToCents('abc')).toBeNull()
    expect(parseAmountToCents('8,555')).toBeNull()
  })

  it('no usa coma flotante: 0,07 son 7 centavos', () => {
    expect(parseAmountToCents('0,07')).toBe(7)
    expect(parseAmountToCents('1,1')).toBe(110)
  })
})
