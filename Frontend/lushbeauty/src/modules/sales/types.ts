export const PAYMENT_METHODS = ['Efectivo', 'QR', 'Transferencia'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const DISCOUNT_REASONS = ['Clienta frecuente', 'Promoción', 'Corrección', 'Otro'] as const
export type DiscountReason = (typeof DISCOUNT_REASONS)[number]

export interface Discount {
  cents: number
  reason: DiscountReason
  detail: string
}

export interface Draft {
  serviceId: string
  specialistId: string
  method: PaymentMethod | null
  discount: Discount | null
  /** Clave de idempotencia (RN-01): se genera una vez por registro y viaja con él al reintentar. */
  clientUuid: string
}

export interface SavedSale {
  clientUuid: string
  serviceName: string
  specialistName: string
  method: PaymentMethod
  listCents: number
  discountCents: number
  discountReason: DiscountReason | null
  chargedCents: number
  commissionCents: number
  commissionBps: number
  savedAt: string
}

export type SaleStatus = 'confirmada' | 'revision' | 'alerta' | 'anulada'

export interface SaleRow {
  id: string
  date: string
  serviceName: string
  specialistName: string
  /** null = «Sin confirmar». */
  method: PaymentMethod | null
  listCents: number
  discountCents: number
  discountReason: string | null
  status: SaleStatus
  registeredAt: string
}
