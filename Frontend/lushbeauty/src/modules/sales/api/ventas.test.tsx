import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '../../../test/renderApp'
import { toCents, toSaleRow } from './ventas'

const VENTA = {
  id: 'v1', estado: 'CONFIRMADA', fecha_servicio: '2026-11-23T15:00:00Z',
  lineas: [{ servicio_id: 'sv', especialista_id: 'sp', precio_lista: '120.00', descuento: '8.00', motivo_descuento: 'Promoción' }],
  pagos: [{ metodo: 'EFECTIVO', monto: '112.00' }],
}
const json = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))

afterEach(() => vi.unstubAllGlobals())

describe('toCents', () => {
  it('convierte texto decimal sin coma flotante', () => {
    expect(toCents('120.00')).toBe(12000)
    expect(toCents('0.1')).toBe(10)
    expect(toCents('112.50')).toBe(11250)
  })
})

describe('toSaleRow', () => {
  it('conserva lista y descuento y traduce estado y método', () => {
    const row = toSaleRow(VENTA as never, { service: () => 'Manicura gel', specialist: () => 'Marisol' })
    expect(row).toMatchObject({ listCents: 12000, discountCents: 800, status: 'confirmada', method: 'Efectivo', serviceName: 'Manicura gel' })
  })
})

describe('Ventas web con sesión real', () => {
  it('lee ventas del API con el token y anula contra el servidor', async () => {
    const fetchMock = vi.fn((url: string, ...rest: [RequestInit?]) => {
      void rest
      if (url.endsWith('/anular/')) return json({ ...VENTA, estado: 'ANULADA' })
      if (url.includes('/ventas/')) return json([VENTA])
      if (url.includes('/servicios/')) return json([{ id: 'sv', nombre: 'Manicura gel' }])
      return json([{ id: 'sp', nombre: 'Marisol' }])
    })
    vi.stubGlobal('fetch', fetchMock)
    renderApp('/web/ventas', { userName: 'marisol', role: 'administradora', token: 'tok' })
    expect(await screen.findByRole('button', { name: 'Manicura gel' })).toBeInTheDocument()
    expect(fetchMock.mock.calls[0][1]?.headers).toMatchObject({ Authorization: 'Bearer tok' })
    await userEvent.click(screen.getByRole('button', { name: /Anular servicio/ }))
    await userEvent.type(screen.getByLabelText('Motivo de la anulación'), 'Error de carga')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar anulación' }))
    await waitFor(() => expect(screen.getByText('Anulada · ajuste registrado')).toBeInTheDocument())
    const call = fetchMock.mock.calls.find(([url]) => url.endsWith('/anular/'))!
    expect(JSON.parse(call[1]?.body as string)).toEqual({ motivo: 'Error de carga' })
  })

  it('avisa si el servidor falla', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('{}', { status: 500 }))))
    renderApp('/web/ventas', { userName: 'marisol', role: 'administradora', token: 'tok' })
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron cargar las ventas')
  })
})
