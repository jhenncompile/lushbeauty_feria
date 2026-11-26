import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AppRoutes } from '../../app/routes'
import { SessionProvider } from '../identity'
import type { Session } from '../identity'
import { SalesProvider } from './index'

const ADMIN: Session = { userName: 'marisol', role: 'administradora' }

function renderAt(path: string, session: Session = ADMIN) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SessionProvider initial={session}>
        <SalesProvider>
          <AppRoutes />
        </SalesProvider>
      </SessionProvider>
    </MemoryRouter>,
  )
}

describe('Hoy', () => {
  it('suma lo cobrado por método y ofrece registrar un servicio', () => {
    renderAt('/hoy')
    expect(screen.getByText('Bs 692')).toBeInTheDocument()
    expect(screen.getByText('Bs 412')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Registrar servicio' })).toHaveAttribute('href', '/registrar')
  })
})

describe('Registrar servicio', () => {
  it('no deja guardar sin método de pago y explica por qué', () => {
    renderAt('/registrar')
    expect(screen.getByRole('button', { name: 'Guardar servicio' })).toBeDisabled()
    expect(screen.getByText('Elija un método de pago para guardar.')).toBeInTheDocument()
  })

  it('guarda sin descuento y muestra el resumen con la lista', async () => {
    renderAt('/registrar')
    await userEvent.click(screen.getByRole('button', { name: 'QR' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar servicio' }))
    expect(screen.getByText('Servicio guardado')).toBeInTheDocument()
    expect(screen.getByText('Bs 120')).toBeInTheDocument()
    expect(screen.getByText('Manicura gel · Marisol · QR')).toBeInTheDocument()
  })

  it('CP-01: descuento de Bs 8 cobra Bs 112, conserva la lista y comisión Bs 42,00', async () => {
    renderAt('/registrar')
    await userEvent.click(screen.getByRole('button', { name: 'Efectivo' }))
    await userEvent.click(screen.getByRole('link', { name: 'Aplicar descuento' }))
    await userEvent.type(screen.getByLabelText('Descuento (Bs)'), '8')
    await userEvent.click(screen.getByRole('button', { name: 'Clienta frecuente' }))
    expect(screen.getByText(/Descuento de 6,7 %\. Está dentro del límite de 10 %/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar descuento' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar servicio' }))
    expect(screen.getByText('Bs 112')).toBeInTheDocument()
    expect(screen.getByText('Bs 120,00')).toBeInTheDocument()
    expect(screen.getByText('− Bs 8,00')).toBeInTheDocument()
    expect(screen.getByText('Bs 42,00')).toBeInTheDocument()
  })

  it('un descuento sobre el límite pide aprobación y bloquea el guardado', async () => {
    renderAt('/registrar')
    await userEvent.click(screen.getByRole('button', { name: 'Efectivo' }))
    await userEvent.click(screen.getByRole('link', { name: 'Aplicar descuento' }))
    await userEvent.type(screen.getByLabelText('Descuento (Bs)'), '15')
    await userEvent.click(screen.getByRole('button', { name: 'Otro' }))
    expect(screen.getByText(/Supera el límite de 10 %/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Solicitar aprobación' }))
    expect(screen.getByRole('button', { name: 'Guardar servicio' })).toBeDisabled()
    expect(screen.getByText(/necesita la aprobación de la administradora/)).toBeInTheDocument()
  })

  it('valida el importe y exige motivo', async () => {
    renderAt('/registrar/descuento')
    await userEvent.type(screen.getByLabelText('Descuento (Bs)'), 'abc')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar descuento' }))
    expect(screen.getByText(/Escriba un importe válido/)).toBeInTheDocument()
    expect(screen.getByText('Error: Elija un motivo.')).toBeInTheDocument()
  })

  it('acepta 8,5 como 8,50 y rechaza más que la lista', async () => {
    renderAt('/registrar/descuento')
    await userEvent.type(screen.getByLabelText('Descuento (Bs)'), '8,5')
    await userEvent.click(screen.getByRole('button', { name: 'Promoción' }))
    expect(screen.getByText('Bs 111,50')).toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText('Descuento (Bs)'))
    await userEvent.type(screen.getByLabelText('Descuento (Bs)'), '121')
    await userEvent.click(screen.getByRole('button', { name: 'Aplicar descuento' }))
    expect(screen.getByText(/no puede superar el precio de lista/)).toBeInTheDocument()
  })

  it('la especialista registra con sus 2 pestañas', () => {
    renderAt('/registrar', { userName: 'paty', role: 'especialista' })
    expect(screen.getByRole('link', { name: 'Mi liquidación' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Caja' })).not.toBeInTheDocument()
  })

  it('sin registro guardado, «guardado» vuelve a Registrar', () => {
    renderAt('/registrar/guardado')
    expect(screen.getByRole('button', { name: 'Guardar servicio' })).toBeInTheDocument()
  })
})

describe('Ventas (web)', () => {
  it('muestra la venta seleccionada con su copia inmutable', () => {
    renderAt('/web/ventas')
    const panel = screen.getByRole('complementary', { name: 'Venta seleccionada' })
    expect(within(panel).getByText('Manicura gel · Marisol')).toBeInTheDocument()
    expect(within(panel).getByText('Bs 42,00')).toBeInTheDocument()
  })

  it('anular exige motivo y conserva la fila como Anulada', async () => {
    renderAt('/web/ventas')
    await userEvent.click(screen.getByRole('button', { name: 'Anular servicio de Bs 112' }))
    expect(screen.getByRole('dialog', { name: /¿Anular/ })).toHaveTextContent('La venta no se borra')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar anulación' }))
    expect(screen.getByText('Error: Escriba el motivo de la anulación.')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Motivo de la anulación'), 'Cobro duplicado')
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar anulación' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Anulada · ajuste registrado')).toBeInTheDocument()
    expect(screen.getAllByText('Manicura gel').length).toBeGreaterThan(0)
  })

  it('filtra por estado', async () => {
    renderAt('/web/ventas')
    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'revision')
    const rows = screen.getAllByRole('row')
    expect(rows).toHaveLength(2)
    expect(within(rows[1]).getByText('Depilación')).toBeInTheDocument()
  })
})
