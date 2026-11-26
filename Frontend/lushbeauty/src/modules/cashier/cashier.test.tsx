import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ADMIN, PATY, renderApp } from '../../test/renderApp'

describe('Cierre de caja (móvil)', () => {
  it('sin contar el efectivo no calcula diferencia y no deja cerrar', async () => {
    renderApp('/caja')
    expect(screen.getByText('Cuente el efectivo para ver lo esperado y la diferencia.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar caja' }))
    expect(screen.getByText(/Error: Escriba el efectivo contado/)).toBeInTheDocument()
    expect(screen.queryByText('Caja cerrada')).not.toBeInTheDocument()
  })

  it('402 contado contra 412 esperado: falta Bs 10,00 y total declarado 682', async () => {
    renderApp('/caja')
    await userEvent.type(screen.getByLabelText('Efectivo contado (Bs)'), '402')
    expect(screen.getByText('Bs 692,00')).toBeInTheDocument()
    expect(screen.getByText('Bs 682,00')).toBeInTheDocument()
    expect(screen.getByText('Falta Bs 10,00 en efectivo')).toBeInTheDocument()
    expect(screen.getByText('− Bs 10,00')).toBeInTheDocument()
  })

  it('con diferencia exige justificación antes de cerrar', async () => {
    renderApp('/caja')
    await userEvent.type(screen.getByLabelText('Efectivo contado (Bs)'), '402')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar caja' }))
    expect(screen.getByText('Error: Explique la diferencia para cerrar la caja.')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Justificación de la diferencia'), 'Vuelto mal dado')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar caja' }))
    const confirmacion = screen.getByRole('dialog', { name: /¿Cerrar la caja/ })
    expect(confirmacion).toHaveTextContent('Vuelto mal dado')
    await userEvent.click(within(confirmacion).getByRole('button', { name: 'Sí, cerrar caja' }))
    expect(screen.getByRole('dialog', { name: 'Cierre registrado' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Entendido' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Caja cerrada')).toBeInTheDocument()
    expect(screen.getByLabelText('Efectivo contado (Bs)')).toHaveAttribute('readonly')
  })

  it('si cuadra no pide justificación y dice «Conciliado»', async () => {
    renderApp('/caja')
    await userEvent.type(screen.getByLabelText('Efectivo contado (Bs)'), '412')
    expect(screen.getByText('Conciliado: el efectivo cuadra')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar caja' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cerrar caja' }))
    expect(screen.getByText('Caja cerrada')).toBeInTheDocument()
  })

  it('sin conexión no cierra y lo explica', () => {
    renderApp('/caja', ADMIN, { online: false, pending: 2 })
    expect(screen.getByRole('button', { name: 'Cerrar caja' })).toBeDisabled()
    expect(screen.getByText('El cierre de caja requiere conexión.')).toBeInTheDocument()
  })

  it('una especialista no accede a la caja', () => {
    renderApp('/caja', PATY)
    expect(screen.queryByRole('heading', { name: 'Cierre de caja' })).not.toBeInTheDocument()
  })
})

describe('Caja (web)', () => {
  it('muestra la diferencia con palabra por método y los últimos cierres', async () => {
    renderApp('/web/caja')
    await userEvent.type(screen.getByLabelText('Efectivo contado (Bs)'), '402')
    const table = screen.getByRole('table')
    expect(within(table).getByRole('row', { name: /Efectivo/ })).toHaveTextContent('− Bs 10,00 · Falta')
    expect(within(table).getByRole('row', { name: /^QR/ })).toHaveTextContent('Bs 0,00 · Conciliado')
    expect(screen.getByText('+ Bs 5,00 justificado')).toBeInTheDocument()
  })

  it('si cuadra, cierra la caja desde la web', async () => {
    renderApp('/web/caja')
    await userEvent.type(screen.getByLabelText('Efectivo contado (Bs)'), '412')
    await userEvent.type(screen.getByLabelText('Justificación de la diferencia'), 'n/a')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar caja' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cerrar caja' }))
    expect(screen.getByText('Caja cerrada')).toBeInTheDocument()
  })
})

describe('Confirmación del cierre', () => {
  it('«Volver» no cierra la caja y devuelve el foco al botón', async () => {
    renderApp('/caja')
    await userEvent.type(screen.getByLabelText('Efectivo contado (Bs)'), '412')
    const boton = screen.getByRole('button', { name: 'Cerrar caja' })
    await userEvent.click(boton)
    expect(screen.getByRole('button', { name: 'Volver' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Caja cerrada')).not.toBeInTheDocument()
    expect(boton).toHaveFocus()
  })

  it('Esc cierra la confirmación sin cerrar la caja', async () => {
    renderApp('/caja')
    await userEvent.type(screen.getByLabelText('Efectivo contado (Bs)'), '412')
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar caja' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Caja cerrada')).not.toBeInTheDocument()
  })
})
