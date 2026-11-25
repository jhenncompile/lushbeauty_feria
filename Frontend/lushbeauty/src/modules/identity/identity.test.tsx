import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { renderApp } from '../../test/renderApp'
import type { Session } from './types'

function renderAt(path: string, initial: Session | null = null) {
  return renderApp(path, initial)
}

describe('ingreso', () => {
  it('muestra errores si faltan usuario o contraseña y no entra', async () => {
    renderAt('/ingresar')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(screen.getByText('Error: Ingrese su usuario.')).toBeInTheDocument()
    expect(screen.getByLabelText('Usuario')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument()
  })

  it('la administradora entra a Hoy con 4 pestañas', async () => {
    renderAt('/ingresar')
    await userEvent.type(screen.getByLabelText('Usuario'), 'marisol')
    await userEvent.type(screen.getByLabelText('Contraseña o PIN'), 'x')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Hoy',
      'Caja',
      'Nómina',
      'Decisiones',
    ])
    expect(screen.getByRole('link', { name: 'Hoy' })).toHaveAttribute('aria-current', 'page')
  })

  it('la especialista entra a Registrar y solo ve 2 pestañas', async () => {
    renderAt('/ingresar')
    await userEvent.type(screen.getByLabelText('Usuario'), 'paty')
    await userEvent.type(screen.getByLabelText('Contraseña o PIN'), '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar como especialista' }))
    expect(screen.getByRole('link', { name: 'Registrar' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Mi liquidación' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Caja' })).not.toBeInTheDocument()
  })
})

describe('rutas por rol', () => {
  it('sin sesión redirige al ingreso', () => {
    renderAt('/caja')
    expect(screen.getByRole('heading', { name: 'Ingresar' })).toBeInTheDocument()
  })

  it('una especialista no accede a la caja y vuelve a su inicio', () => {
    renderAt('/caja', { userName: 'paty', role: 'especialista' })
    expect(screen.getByRole('heading', { name: 'Registrar servicio' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Cierre de caja' })).not.toBeInTheDocument()
  })

  it('la administradora sí accede a la caja', () => {
    renderAt('/caja', { userName: 'marisol', role: 'administradora' })
    expect(screen.getByRole('heading', { name: 'Cierre de caja' })).toBeInTheDocument()
  })
})
