import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'
import { BASE_COUNTS, canConfirm, summarize } from './domain/review'

describe('Importador', () => {
  it('no deja confirmar con pendientes y cuenta las decisiones', () => {
    expect(canConfirm(summarize({}))).toBe(false)
    expect(summarize({ a: 'accepted', b: 'rejected' })).toEqual({ accepted: BASE_COUNTS.accepted + 1, rejected: BASE_COUNTS.rejected + 1, toReview: 9 })
  })
  it('un descuento sin motivo exige elegir motivo para aceptarse', async () => {
    renderApp('/importar/revisar')
    expect(screen.getByRole('button', { name: 'Confirmar importación' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Elegir motivo' }))
    await userEvent.click(screen.getByRole('button', { name: 'Promoción' }))
    expect(screen.getByText('Aceptada · Promoción')).toBeInTheDocument()
  })
})
