import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ADMIN, PATY, renderApp } from '../../test/renderApp'

describe('Liquidación semanal (móvil)', () => {
  it('muestra el total a pagar y el neto por especialista', () => {
    renderApp('/nomina')
    expect(screen.getByText('Bs 817,00')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Paty/ })).toHaveTextContent('Bs 146')
    expect(screen.getByRole('link', { name: /Katherine/ })).toHaveTextContent('Bs 112')
    expect(screen.getByRole('link', { name: /Marisol/ })).toHaveTextContent('Bs 559')
    expect(screen.getByText('Verificada')).toHaveAttribute('aria-current', 'step')
  })

  it('aprobar lleva a la pantalla de aprobada con total y avisos', async () => {
    renderApp('/nomina')
    await userEvent.click(screen.getByRole('button', { name: 'Aprobar liquidación' }))
    expect(screen.getByRole('heading', { name: 'Liquidación aprobada' })).toBeInTheDocument()
    expect(screen.getByText('Bs 817')).toBeInTheDocument()
    expect(screen.getByText(/Error: no se pudo enviar el aviso/)).toBeInTheDocument()
  })

  it('un aviso fallido se reintenta sin afectar la liquidación', async () => {
    renderApp('/nomina')
    await userEvent.click(screen.getByRole('button', { name: 'Aprobar liquidación' }))
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar aviso a Katherine' }))
    expect(screen.queryByText(/Error: no se pudo enviar/)).not.toBeInTheDocument()
    expect(screen.getAllByText('Enviado')).toHaveLength(3)
    expect(screen.getByRole('heading', { name: 'Liquidación aprobada' })).toBeInTheDocument()
  })

  it('sin conexión no deja aprobar y lo explica', () => {
    renderApp('/nomina', ADMIN, { online: false, pending: 3 })
    expect(screen.getByRole('button', { name: 'Aprobar liquidación' })).toBeDisabled()
    expect(screen.getByText('Aprobar una liquidación requiere conexión.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Sin conexión · 3 pendientes')
  })

  it('«aprobada» sin haber aprobado vuelve a la liquidación', () => {
    renderApp('/nomina/aprobada')
    expect(screen.getByRole('button', { name: 'Aprobar liquidación' })).toBeInTheDocument()
  })
})

describe('Detalle de liquidación', () => {
  it('Paty: 4 líneas, comisión 161, neto 146 y comparación de políticas', async () => {
    renderApp('/nomina')
    await userEvent.click(screen.getByRole('link', { name: /Paty/ }))
    expect(screen.getByRole('heading', { name: 'Detalle de Paty' })).toBeInTheDocument()
    expect(screen.getByText('Pestañas')).toBeInTheDocument()
    expect(screen.getByText('Bs 146,00')).toBeInTheDocument()
    expect(screen.getByText('Bs 154,70')).toBeInTheDocument()
    expect(screen.getByText('Bs 6,30')).toBeInTheDocument()
    expect(screen.getByText('− Bs 30,00')).toBeInTheDocument()
  })

  it('una especialista sin detalle por línea lo dice y no inventa filas', async () => {
    renderApp('/nomina/katherine')
    expect(screen.getByText(/llega con el servidor/)).toBeInTheDocument()
  })

  it('una id inexistente vuelve a la liquidación', () => {
    renderApp('/nomina/nadie')
    expect(screen.getByRole('heading', { name: 'Liquidación semanal' })).toBeInTheDocument()
  })
})

describe('Mi liquidación (especialista)', () => {
  it('Paty ve solo la suya, con neto 146 y su pestaña actual', () => {
    renderApp('/mi-liquidacion', PATY)
    expect(screen.getByText('Bs 146,00')).toBeInTheDocument()
    expect(screen.getByText('+ Bs 15,00')).toBeInTheDocument()
    expect(screen.getByText('Adelanto')).toBeInTheDocument()
    expect(screen.queryByText(/Katherine/)).not.toBeInTheDocument()
    expect(screen.queryByText('Bs 112,00')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mi liquidación' })).toHaveAttribute('aria-current', 'page')
  })

  it('una especialista no puede abrir la nómina de la administradora', () => {
    renderApp('/nomina', PATY)
    expect(screen.queryByText('Total a pagar')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mi liquidación' })).toBeInTheDocument()
  })

  it('un usuario sin liquidación recibe un mensaje claro', () => {
    renderApp('/mi-liquidacion', { userName: 'lucia', role: 'especialista' })
    expect(screen.getByText('No hay una liquidación para su usuario en esta semana.')).toBeInTheDocument()
  })
})

describe('Nómina (web)', () => {
  it('tabla con totales y neto total', () => {
    renderApp('/web/nomina')
    const table = screen.getByRole('table')
    const total = within(table).getByRole('row', { name: /Total/ })
    expect(total).toHaveTextContent('Bs 812,00')
    expect(total).toHaveTextContent('Bs 817,00')
    expect(screen.getByText('Simulación. No altera la liquidación.')).toBeInTheDocument()
  })

  it('aprobar cambia el estado y retira el botón', async () => {
    renderApp('/web/nomina')
    await userEvent.click(screen.getByRole('button', { name: 'Aprobar liquidación' }))
    expect(screen.getByText('Liquidación aprobada')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Aprobar liquidación' })).not.toBeInTheDocument()
  })
})
