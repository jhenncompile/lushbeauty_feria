import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('tiene un solo <main> y no deja texto de nota de diseño en producción', () => {
    renderApp('/inicio', null)
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.queryByText(/Sustituible por fotografía/)).not.toBeInTheDocument()
  })
  it('Aprobar y Descartar del ejemplo no navegan: explican quién decide', async () => {
    renderApp('/inicio', null)
    await userEvent.click(screen.getByRole('button', { name: 'Aprobar' }))
    expect(screen.getByText(/solo la administradora aprueba/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /El arte del detalle/ })).toBeInTheDocument()
  })
  it('flujo: inicio → ingreso → volver al inicio', async () => {
    renderApp('/', null)
    await userEvent.click(screen.getAllByRole('link', { name: 'Ingresar' })[0])
    expect(screen.getByRole('heading', { level: 1, name: 'Ingresar' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: 'Volver al inicio' }))
    expect(screen.getByRole('heading', { level: 1, name: /El arte del detalle/ })).toBeInTheDocument()
  })

  it('los aros decorativos no alteran el texto accesible de los títulos', () => {
    const { container } = renderApp('/inicio', null)
    const marked = container.querySelectorAll('h2 [data-ring]')
    expect(marked.length).toBeGreaterThanOrEqual(4)
    expect(screen.getByRole('heading', { level: 2, name: 'Belleza en la silla. Exactitud en la caja.' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Antes de ingresar' })).toBeInTheDocument()
    expect(container.querySelector('svg.thread')).toHaveAttribute('aria-hidden', 'true')
  })
})
