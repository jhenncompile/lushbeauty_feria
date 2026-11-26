import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ADMIN, PATY, renderApp } from '../../test/renderApp'

describe('Sincronización · cola de envío', () => {
  it('sin conexión muestra 3 pendientes, una confirmada y una que requiere revisión', () => {
    renderApp('/sincronizacion', ADMIN, { online: false, pending: 3 })
    expect(screen.getAllByRole('status')[0]).toHaveTextContent('Sin conexión · 3 pendientes')
    expect(screen.getAllByText('Pendiente')).toHaveLength(3)
    expect(screen.getByText('Confirmada')).toBeInTheDocument()
    expect(screen.getByText('Requiere revisión')).toBeInTheDocument()
    expect(screen.getByText(/el catálogo cambió el precio mientras no había conexión/)).toBeInTheDocument()
    expect(screen.getByText(/no se duplica/)).toBeInTheDocument()
  })

  it('reintentar sin conexión no pierde nada y lo dice', async () => {
    renderApp('/sincronizacion', ADMIN, { online: false, pending: 3 })
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar envío' }))
    expect(screen.getByRole('dialog', { name: 'Todavía no se pudo enviar' })).toHaveTextContent(
      'Sigue sin conexión. Sus registros están a salvo en este teléfono.',
    )
    expect(screen.getAllByText('Pendiente')).toHaveLength(3)
  })

  it('el registro en revisión espera la confirmación del importe y entra a la cola', async () => {
    renderApp('/sincronizacion', ADMIN, { online: false, pending: 3 })
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar importe de Bs 40,00' }))
    expect(screen.queryByText('Requiere revisión')).not.toBeInTheDocument()
    expect(screen.getAllByText('Pendiente')).toHaveLength(4)
  })

  it('con la cola vacía lo dice y el botón de reintento queda deshabilitado', () => {
    renderApp('/sincronizacion')
    expect(screen.getByText('No hay registros en la cola. Todo está sincronizado.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar envío' })).toBeDisabled()
  })

  it('la especialista vuelve a su inicio, no al de la administradora', () => {
    renderApp('/sincronizacion', PATY)
    expect(screen.getByRole('link', { name: 'Volver' })).toHaveAttribute('href', '/registrar')
  })
})

describe('Guardar un servicio sin conexión', () => {
  it('queda pendiente en la cola con su importe y la pantalla lo avisa', async () => {
    renderApp('/registrar', ADMIN, { online: false })
    await userEvent.click(screen.getByRole('button', { name: 'Efectivo' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar servicio' }))
    expect(screen.getByText(/Guardado en este teléfono: se enviará al volver la conexión/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('link', { name: /Sin conexión · 1 pendientes/ }))
    const item = screen.getByRole('listitem')
    expect(within(item).getByText('Manicura gel · Marisol')).toBeInTheDocument()
    expect(within(item).getByText('Bs 120,00')).toBeInTheDocument()
    expect(within(item).getByText('Pendiente')).toBeInTheDocument()
  })

  it('con conexión se confirma de inmediato', async () => {
    renderApp('/registrar')
    await userEvent.click(screen.getByRole('button', { name: 'QR' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar servicio' }))
    await userEvent.click(screen.getByRole('link', { name: /En línea/ }))
    expect(screen.getByText('Confirmada')).toBeInTheDocument()
  })
})

describe('Hoy · atajo a la cola', () => {
  it('avisa cuántos registros faltan por enviar', () => {
    renderApp('/hoy', ADMIN, { online: false, pending: 3 })
    expect(screen.getByRole('link', { name: /Cola de envío/ })).toHaveTextContent('3 por enviar')
  })

  it('con todo enviado dice «Al día»', () => {
    renderApp('/hoy')
    expect(screen.getByRole('link', { name: /Cola de envío/ })).toHaveTextContent('Al día')
  })
})
