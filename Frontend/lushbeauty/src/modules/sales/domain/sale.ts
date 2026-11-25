/** Reglas puras de una venta: sin React, sin red. Todo en centavos enteros. */

export interface SaleInput {
  listCents: number
  discountCents: number
}

export interface SalePolicy {
  commissionBps: number
  maxDiscountBps: number
}

export interface SaleResult {
  listCents: number
  discountCents: number
  chargedCents: number
  /** Descuento sobre la lista, en puntos básicos (redondeado al entero más cercano). */
  discountBps: number
  /** Comisión sobre el precio de lista. */
  commissionCents: number
  exceedsLimit: boolean
}

function roundDiv(numerator: number, denominator: number): number {
  return Math.floor((numerator * 2 + denominator) / (denominator * 2))
}

export function calculateSale(input: SaleInput, policy: SalePolicy): SaleResult {
  const { listCents, discountCents } = input
  if (!Number.isInteger(listCents) || !Number.isInteger(discountCents)) {
    throw new RangeError('Los importes deben ser centavos enteros')
  }
  if (discountCents < 0 || discountCents > listCents) {
    throw new RangeError('El descuento debe estar entre 0 y el precio de lista')
  }
  return {
    listCents,
    discountCents,
    chargedCents: listCents - discountCents,
    discountBps: listCents === 0 ? 0 : roundDiv(discountCents * 10000, listCents),
    // Redondeo provisional (mitad hacia arriba): la regla real es la decisión abierta 1 (RN-03).
    commissionCents: roundDiv(listCents * policy.commissionBps, 10000),
    // Comparación exacta con enteros, sin pasar por porcentajes redondeados.
    exceedsLimit: discountCents * 10000 > policy.maxDiscountBps * listCents,
  }
}

/** 667 → «6,7 %»; 1000 → «10 %». */
export function formatPercent(bps: number): string {
  const tenths = roundDiv(bps, 10)
  const whole = Math.floor(tenths / 10)
  const decimal = tenths % 10
  return `${whole}${decimal ? `,${decimal}` : ''} %`
}
