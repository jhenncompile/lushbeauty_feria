import type { PaymentMethod, SaleRow } from './types'

/** Resumen sintético del día para «Hoy». */
export const TODAY = {
  label: 'Lunes 23 nov 2026',
  servicesCount: 6,
  byMethod: [
    { method: 'Efectivo', cents: 41200 },
    { method: 'QR', cents: 20000 },
    { method: 'Transferencia', cents: 8000 },
  ] satisfies Array<{ method: PaymentMethod; cents: number }>,
}

export const WEB_SALES: SaleRow[] = [
  { id: 's1', date: '23 nov', serviceName: 'Manicura gel', specialistName: 'Marisol', method: 'Efectivo', listCents: 12000, discountCents: 800, discountReason: 'Clienta frecuente', status: 'confirmada', registeredAt: '23 nov 2026' },
  { id: 's2', date: '23 nov', serviceName: 'Pedicura', specialistName: 'Paty', method: 'QR', listCents: 10000, discountCents: 0, discountReason: null, status: 'confirmada', registeredAt: '23 nov 2026' },
  { id: 's3', date: '23 nov', serviceName: 'Cejas', specialistName: 'Katherine', method: 'Efectivo', listCents: 6000, discountCents: 0, discountReason: null, status: 'confirmada', registeredAt: '23 nov 2026' },
  { id: 's4', date: '23 nov', serviceName: 'Pestañas', specialistName: 'Paty', method: 'Transferencia', listCents: 18000, discountCents: 1000, discountReason: 'Promoción', status: 'confirmada', registeredAt: '23 nov 2026' },
  { id: 's5', date: '23 nov', serviceName: 'Depilación', specialistName: 'Katherine', method: null, listCents: 4000, discountCents: 0, discountReason: null, status: 'revision', registeredAt: '23 nov 2026' },
  { id: 's6', date: '22 nov', serviceName: 'Manicura gel', specialistName: 'Katherine', method: 'QR', listCents: 12000, discountCents: 1800, discountReason: 'Otro', status: 'alerta', registeredAt: '22 nov 2026' },
  { id: 's7', date: '22 nov', serviceName: 'Lush Little Princess', specialistName: 'Marisol', method: 'Efectivo', listCents: 8000, discountCents: 0, discountReason: null, status: 'confirmada', registeredAt: '22 nov 2026' },
  { id: 's8', date: '22 nov', serviceName: 'Pedicura', specialistName: 'Marisol', method: 'Efectivo', listCents: 10000, discountCents: 0, discountReason: null, status: 'anulada', registeredAt: '22 nov 2026' },
]
