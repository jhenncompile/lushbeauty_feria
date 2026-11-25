/**
 * Dinero en centavos enteros (nunca float). El redondeo de moneda es una
 * decisión abierta (RN-03): aquí solo se formatea y se lee, no se redondea.
 */

const MINUS = '−'

export interface FormatOptions {
  /** 2 (por defecto) siempre muestra centavos; 0 los omite solo si son cero. */
  decimals?: 0 | 2
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

export function formatBs(cents: number, options: FormatOptions = {}): string {
  const { decimals = 2 } = options
  const negative = cents < 0
  const abs = Math.abs(Math.trunc(cents))
  const whole = Math.floor(abs / 100)
  const fraction = abs % 100
  const showFraction = decimals === 2 || fraction !== 0
  const body = `Bs ${groupThousands(String(whole))}${
    showFraction ? `,${String(fraction).padStart(2, '0')}` : ''
  }`
  return negative ? `${MINUS} ${body}` : body
}

const AMOUNT = /^(\d+)(?:[.,](\d{1,2}))?$/

/** Lee «8», «8,5», «8,50» o «8.5» como centavos; devuelve null si no es válido. */
export function parseAmountToCents(input: string): number | null {
  const match = AMOUNT.exec(input.trim())
  if (!match) return null
  const [, whole, fraction = ''] = match
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}
