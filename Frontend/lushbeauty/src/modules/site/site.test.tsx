import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'

describe('Sitio público', () => {
  it('el inicio es público y lleva al ingreso', () => {
    renderApp('/inicio', null)
    expect(screen.getByRole('heading', { level: 1, name: /El arte del detalle/ })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Ingresar' }).length).toBeGreaterThan(0)
  })
  it('el banner deja marcadores en lugar de inventar datos del stand', () => {
    renderApp('/feria', null)
    expect(screen.getAllByText(/\[Sitio web\]/).length).toBeGreaterThan(0)
  })
})
