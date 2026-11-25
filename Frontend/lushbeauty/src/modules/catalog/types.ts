export interface CatalogService {
  id: string
  name: string
  description: string
  /** Precio de lista en centavos. */
  listPriceCents: number
  durationMin: number
}

/**
 * Políticas ILUSTRATIVAS tomadas del diseño. No son reglas del negocio: dependen de las
 * decisiones abiertas 2 (base de comisión) y 6 (descuento máximo). Se reemplazan por datos reales en F02.
 */
export interface IllustrativePolicy {
  /** Comisión en puntos básicos (3500 = 35 %). */
  commissionBps: number
  commissionBase: 'lista' | 'neto'
  /** Descuento máximo sin aprobación, en puntos básicos (1000 = 10 %). */
  maxDiscountBps: number
}
