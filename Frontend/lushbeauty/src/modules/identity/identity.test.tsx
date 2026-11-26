import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '../../test/renderApp'
import type { Session } from './types'

function renderAt(path: string, initial: Session | null = null) {
  return renderApp(path, initial)
}

function mockLogin(status: number, body: unknown = {}) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status }))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const okAs = (roles: string[], nombre = 'Usuaria') => ({ token: 't0k3n', usuario: { nombre, roles } })

afterEach(() => vi.unstubAllGlobals())

describe('ingreso', () => {
  it('muestra errores si faltan usuario o contraseña y no entra', async () => {
    const fetchMock = mockLogin(200)
    renderAt('/ingresar')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText('Error: Ingrese su usuario.')).toBeInTheDocument()
    expect(screen.getByLabelText('Usuario')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument()
  })

  it('la administradora entra a Hoy con 4 pestañas', async () => {
    const fetchMock = mockLogin(200, okAs(['ADMINISTRADORA'], 'Marisol'))
    renderAt('/ingresar')
    await userEvent.type(screen.getByLabelText('Usuario'), 'marisol')
    await userEvent.type(screen.getByLabelText('Contraseña o PIN'), 'x')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    const nav = await screen.findByRole('navigation', { name: 'Principal' })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({ body: JSON.stringify({ email: 'marisol', password: 'x' }) }),
    )
    expect(within(nav).getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Hoy',
      'Caja',
      'Nómina',
      'Decisiones',
    ])
    expect(screen.getByRole('link', { name: 'Hoy' })).toHaveAttribute('aria-current', 'page')
  })

  it('la especialista entra a Registrar y solo ve 2 pestañas', async () => {
    mockLogin(200, okAs(['ESPECIALISTA'], 'Paty'))
    renderAt('/ingresar')
    await userEvent.type(screen.getByLabelText('Usuario'), 'paty')
    await userEvent.type(screen.getByLabelText('Contraseña o PIN'), '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByRole('link', { name: 'Registrar' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Mi liquidación' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Caja' })).not.toBeInTheDocument()
  })
})

describe('ingreso con errores del servidor', () => {
  async function submit() {
    renderAt('/ingresar')
    await userEvent.type(screen.getByLabelText('Usuario'), 'paty')
    await userEvent.type(screen.getByLabelText('Contraseña o PIN'), 'mala')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
  }

  it('credenciales incorrectas muestran el error y no entran', async () => {
    mockLogin(401, { detail: 'Credenciales incorrectas.' })
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos.')
    expect(screen.queryByRole('navigation', { name: 'Principal' })).not.toBeInTheDocument()
  })

  it('sin conexión muestra un aviso y deja reintentar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')))
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('No hay conexión con el servidor')
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled()
  })

  it('una cuenta sin rol reconocido no entra', async () => {
    mockLogin(200, okAs(['OTRO']))
    await submit()
    expect(await screen.findByRole('alert')).toHaveTextContent('no tiene un rol asignado')
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
