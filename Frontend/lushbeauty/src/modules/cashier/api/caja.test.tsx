import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderApp } from '../../../test/renderApp'
import { summarizeCierres } from './caja'

const json = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }))
const ADMIN_REAL = { userName: 'marisol', role: 'administradora' as const, token: 'tok' }
const today = new Date()
const pad = (n: number) => String(n).padStart(2, '0')
const DAY = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

afterEach(() => vi.unstubAllGlobals())

describe('summarizeCierres', () => {
  it('agrupa por día y marca cuadrado o con diferencia', () => {
    const rows = [
      { id: '1', fecha: '2026-11-22', metodo: 'EFECTIVO', esperado: '410.00', declarado: '410.00', diferencia: '0.00', estado: 'CUADRA', justificacion: null },
      { id: '2', fecha: '2026-11-21', metodo: 'EFECTIVO', esperado: '580.00', declarado: '585.00', diferencia: '5.00', estado: 'SOBRA', justificacion: 'x' },
    ] as const
    const out = summarizeCierres([...rows])
    expect(out[0]).toMatchObject({ date: '22 nov', tag: 'Cuadrado', tone: 'ok' })
    expect(out[1]).toMatchObject({ tag: '+ Bs 5,00 justificado', note: 'Esperado Bs 580,00 · Contado Bs 585,00' })
  })
})

describe('Cierre de caja web con sesión real', () => {
  it('usa el esperado del servidor y registra el cierre con POST', async () => {
    const fetchMock = vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') return json([], 201)
      if (url.includes('/caja/resumen/'))
        return json([{ dia: DAY, por_metodo: { EFECTIVO: '100.00', QR: '50.00', TRANSFERENCIA: '0.00', TARJETA: '0.00' } }])
      return json([])
    })
    vi.stubGlobal('fetch', fetchMock)
    renderApp('/web/caja', ADMIN_REAL)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    await userEvent.type(screen.getByLabelText('Efectivo contado (Bs)'), '95')
    await userEvent.type(screen.getByLabelText('Justificación de la diferencia'), 'Cambio dado')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar caja' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cerrar caja' }))
    expect(await screen.findByText('Cierre registrado')).toBeInTheDocument()
    const post = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')!
    const body = JSON.parse(post[1]!.body as string)
    expect(body.fecha).toBe(DAY)
    expect(body.declaraciones).toContainEqual({ metodo: 'EFECTIVO', declarado: '95.00', justificacion: 'Cambio dado' })
    expect(body.declaraciones).toContainEqual({ metodo: 'QR', declarado: '50.00' })
  })

  it('muestra el error del servidor y no cierra', async () => {
    vi.stubGlobal('fetch', vi.fn((url: string, init?: RequestInit) => {
      if (init?.method === 'POST') return json({ detail: 'El cierre de EFECTIVO ya está aprobado.' }, 409)
      return json(url.includes('/resumen/') ? [] : [])
    }))
    renderApp('/web/caja', ADMIN_REAL)
    await userEvent.type(screen.getByLabelText('Efectivo contado (Bs)'), '0')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar caja' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cerrar caja' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('ya está aprobado')
    expect(screen.queryByText('Caja cerrada')).not.toBeInTheDocument()
  })
})
