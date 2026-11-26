import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ADMIN, PATY, renderApp } from '../../test/renderApp'

afterEach(() => vi.unstubAllGlobals())

describe('Panel financiero (web)', () => {
  it('muestra las cifras clave rotuladas como ilustrativas', () => {
    renderApp('/web/panel')
    expect(screen.getByRole('heading', { name: 'Panel financiero' })).toBeInTheDocument()
    const summary = screen.getByRole('region', { name: 'Resumen' })
    expect(within(summary).getByText('Bs 2.320')).toBeInTheDocument()
    expect(within(summary).getByText('Bs 2.206')).toBeInTheDocument()
    expect(within(summary).getByText('4,9 % del bruto')).toBeInTheDocument()
    expect(within(summary).getByText('Bs 812,00')).toBeInTheDocument()
    expect(within(summary).getAllByText('Ilustrativo').length).toBeGreaterThanOrEqual(5)
  })

  it('la tabla por especialista suma el total sin diferencias', () => {
    renderApp('/web/panel')
    const total = within(screen.getByRole('table')).getByRole('row', { name: /^Total/ })
    expect(total).toHaveTextContent('21')
    expect(total).toHaveTextContent('Bs 2.320')
    expect(total).toHaveTextContent('Bs 114')
    expect(total).toHaveTextContent('Bs 2.206')
    expect(total).toHaveTextContent('Bs 812,00')
  })

  it('«Requiere atención» lleva a caja y ventas', () => {
    renderApp('/web/panel')
    expect(screen.getByRole('link', { name: /Cierre del 23 nov/ })).toHaveAttribute('href', '/web/caja')
    expect(screen.getByRole('link', { name: /1 venta requiere revisión/ })).toHaveAttribute('href', '/web/ventas')
  })

  it('una especialista no accede al panel', () => {
    renderApp('/web/panel', PATY)
    expect(screen.queryByRole('heading', { name: 'Panel financiero' })).not.toBeInTheDocument()
  })
})

describe('Ingreso en pantalla ancha', () => {
  it('la administradora entra al panel web; en pantalla angosta, a Hoy', async () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: query.includes('1000px'), media: query }))
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ token: 't', usuario: { nombre: ADMIN.userName, roles: ['ADMINISTRADORA'] } })),
      ),
    )
    renderApp('/ingresar', null)
    await userEvent.type(screen.getByLabelText('Usuario'), ADMIN.userName)
    await userEvent.type(screen.getByLabelText('Contraseña o PIN'), 'x')
    await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
    expect(await screen.findByRole('heading', { name: 'Panel financiero' })).toBeInTheDocument()
  })
})
