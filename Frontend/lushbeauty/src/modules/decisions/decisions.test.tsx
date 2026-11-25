import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'
import { bestIndex, formatTenths, weightedTenths } from './domain/matrix'
import { simulate } from './domain/simulation'
import { CRITERIA, DEFAULT_SCENARIO, SENSITIVITY_WEIGHTS } from './fixtures'

describe('simulación What-If (dominio)', () => {
  it('Manicura gel: contribución 58, 52 y 46 y servicios para igualar 112 y 127', () => {
    const rows = simulate(DEFAULT_SCENARIO)
    expect(rows.map((r) => r.contributionCents)).toEqual([5800, 5200, 4600])
    expect(rows.map((r) => r.weeklyCents)).toEqual([580000, 520000, 460000])
    expect(rows.map((r) => r.servicesToMatch)).toEqual([null, 112, 127])
  })
  it('rechaza importes no enteros', () => {
    expect(() => simulate({ ...DEFAULT_SCENARIO, listCents: 12000.5 })).toThrow(RangeError)
  })
})

describe('matriz multicriterio (dominio)', () => {
  it('puntajes 7,9 · 7,4 · 7,0 y, con atracción 50 %, 6,5 · 7,0 · 7,4', () => {
    expect(weightedTenths(CRITERIA).map(formatTenths)).toEqual(['7,9', '7,4', '7,0'])
    const shifted = weightedTenths(CRITERIA, SENSITIVITY_WEIGHTS)
    expect(shifted.map(formatTenths)).toEqual(['6,5', '7,0', '7,4'])
    expect(bestIndex(weightedTenths(CRITERIA))).toBe(0)
    expect(bestIndex(shifted)).toBe(2)
  })
})

describe('Decision Studio (pantallas)', () => {
  it('el simulador recalcula al cambiar el precio y avisa si el dato no es válido', async () => {
    renderApp('/decisiones')
    const table = screen.getByRole('table', { name: 'Resultado por alternativa' })
    expect(within(table).getByText('Bs 5.800')).toBeInTheDocument()
    const price = screen.getByLabelText('Precio de lista (Bs)')
    await userEvent.clear(price)
    await userEvent.type(price, 'abc')
    expect(screen.getByText(/Error: Escriba un precio de lista/)).toBeInTheDocument()
  })
  it('la recomendación dice que decide la administradora y marca supuestos', () => {
    renderApp('/decisiones/recomendacion')
    expect(screen.getByRole('heading', { name: 'Mantener el precio de Bs 120' })).toBeInTheDocument()
    expect(screen.getAllByText('Supuesto').length).toBeGreaterThan(0)
    expect(screen.getByText(/Solo la administradora puede aprobar/)).toBeInTheDocument()
  })
})
