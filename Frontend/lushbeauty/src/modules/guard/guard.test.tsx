import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'
import { countPending, markReviewed } from './domain/alerts'
import { ALERTS } from './fixtures'

describe('Lush Guard', () => {
  it('marcar revisada guarda quién y no toca las ya revisadas', () => {
    const next = markReviewed(ALERTS, 'a1', 'Marisol')
    expect(countPending(next)).toBe(1)
    expect(next[0].reviewedBy).toBe('Marisol')
    expect(markReviewed(next, 'a3', 'Otra')[2].reviewedBy).toBe('Marisol')
  })
  it('en la web filtra por estado y revisa una alerta', async () => {
    renderApp('/web/guard')
    expect(screen.getByRole('link', { name: 'Por revisar · 2' })).toBeInTheDocument()
    await userEvent.click(screen.getAllByRole('button', { name: 'Marcar revisada' })[0])
    expect(screen.getByRole('link', { name: 'Por revisar · 1' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Revisadas · 2' })).toBeInTheDocument()
  })
})
