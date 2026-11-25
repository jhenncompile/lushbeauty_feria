import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'
import { answerQuestion } from './domain/answer'

describe('Lush Insight', () => {
  it('sin datos dice «Información insuficiente» y no inventa cifras', () => {
    expect(answerQuestion('¿Cuál fue la utilidad neta de octubre?').kind).toBe('insufficient')
    expect(answerQuestion('¿Qué opina del clima?').kind).toBe('insufficient')
  })
  it('responde descuentos con cifras de reporte', async () => {
    renderApp('/insight')
    expect(screen.getAllByText('Información insuficiente').length).toBe(1)
    await userEvent.type(screen.getByLabelText('Su pregunta'), '¿Cuánto se cobró por QR esta semana?')
    await userEvent.click(screen.getByRole('button', { name: 'Preguntar' }))
    expect(screen.getByText('Bs 700')).toBeInTheDocument()
  })
})
