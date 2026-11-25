/** Porcentajes con enteros, sin float. */

function roundDiv(numerator: number, denominator: number): number {
  return Math.floor((numerator * 2 + denominator) / (denominator * 2))
}

/** 0–100 para anchos de barra. */
export function wholePercent(part: number, total: number): number {
  return total === 0 ? 0 : roundDiv(part * 100, total)
}

/** «4,9 %»; omite «,0». */
export function oneDecimalPercent(part: number, total: number): string {
  if (total === 0) return '0 %'
  const tenths = roundDiv(part * 1000, total)
  const whole = Math.floor(tenths / 10)
  const decimal = tenths % 10
  return `${whole}${decimal ? `,${decimal}` : ''} %`
}
