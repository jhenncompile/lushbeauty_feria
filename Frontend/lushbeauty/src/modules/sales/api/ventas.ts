import type { PaymentMethod, SaleRow, SaleStatus } from '../types'

/** Forma de `venta_salida` del backend (`apps/sales/api/serializers.py`). Los importes llegan como texto decimal. */
interface VentaApi {
  id: string
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'REQUIERE_REVISION' | 'ANULADA'
  fecha_servicio: string
  lineas: Array<{
    servicio_id: string
    especialista_id: string
    precio_lista: string
    descuento: string
    motivo_descuento: string | null
  }>
  pagos: Array<{ metodo: string; monto: string }>
}

export class VentasError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const METHOD_BY_CODE: Record<string, PaymentMethod> = { EFECTIVO: 'Efectivo', QR: 'QR', TRANSFERENCIA: 'Transferencia' }
const STATUS_BY_CODE: Record<VentaApi['estado'], SaleStatus> = {
  PENDIENTE: 'revision',
  CONFIRMADA: 'confirmada',
  REQUIERE_REVISION: 'revision',
  ANULADA: 'anulada',
}

/** «120.00» → 12000. Sin pasar por coma flotante: el dinero se parte como texto. */
export function toCents(amount: string): number {
  const [whole, fraction = ''] = amount.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0').slice(0, 2)) * (whole.startsWith('-') ? -1 : 1)
}

const dayFormat = new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'short' })
const fullFormat = new Intl.DateTimeFormat('es-BO', { day: 'numeric', month: 'short', year: 'numeric' })

/**
 * Una venta del API puede traer varias líneas; la tabla muestra una fila por venta con sus totales.
 * Los nombres de servicio y especialista se resuelven con los catálogos (por ID); si no están, se muestra «Servicio».
 */
export function toSaleRow(
  venta: VentaApi,
  names: { service: (id: string) => string | undefined; specialist: (id: string) => string | undefined },
): SaleRow {
  const first = venta.lineas[0]
  const date = new Date(venta.fecha_servicio)
  const extra = venta.lineas.length - 1
  const service = names.service(first.servicio_id) ?? 'Servicio'
  return {
    id: venta.id,
    date: dayFormat.format(date).replace('.', ''),
    serviceName: extra > 0 ? `${service} (+${extra})` : service,
    specialistName: names.specialist(first.especialista_id) ?? 'Especialista',
    method: venta.pagos.length === 1 ? (METHOD_BY_CODE[venta.pagos[0].metodo] ?? null) : null,
    listCents: venta.lineas.reduce((sum, l) => sum + toCents(l.precio_lista), 0),
    discountCents: venta.lineas.reduce((sum, l) => sum + toCents(l.descuento), 0),
    discountReason: venta.lineas.find((l) => l.motivo_descuento)?.motivo_descuento ?? null,
    status: STATUS_BY_CODE[venta.estado],
    registeredAt: fullFormat.format(date).replace(/\./g, ''),
  }
}

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init?.headers },
    })
  } catch {
    throw new VentasError(0, 'No hay conexión con el servidor.')
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new VentasError(response.status, body.detail ?? 'El servidor no pudo atender la solicitud.')
  }
  return (await response.json()) as T
}

export const listVentas = (token: string) => request<VentaApi[]>('/api/v1/ventas/', token)

export const anularVenta = (token: string, id: string, motivo: string) =>
  request<VentaApi>(`/api/v1/ventas/${id}/anular/`, token, { method: 'POST', body: JSON.stringify({ motivo }) })

interface NamedItem { id: string; nombre: string }
export const listServiceNames = (token: string) => request<NamedItem[]>('/api/v1/servicios/', token)
export const listSpecialistNames = (token: string) => request<NamedItem[]>('/api/v1/especialistas/', token)
export type { VentaApi }
