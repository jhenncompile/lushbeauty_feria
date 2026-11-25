import { bestIndex, formatTenths, weightedTenths } from './matrix'
import { CRITERIA } from '../fixtures'

const HEADLINES = ['Mantener el precio de Bs 120', 'Aplicar un descuento de 5 %', 'Aplicar un descuento de 10 %']

/** Texto de la recomendación a partir de los puntajes: sugiere, no decide. */
export function recommendation() {
  const tenths = weightedTenths(CRITERIA)
  const best = bestIndex(tenths)
  const others = tenths.filter((_, index) => index !== best).map(formatTenths)
  return {
    headline: HEADLINES[best],
    reason:
      best === 0
        ? `Con los pesos actuales obtiene ${formatTenths(tenths[best])} puntos, frente a ${others.join(' y ')} de los descuentos de 5\u2009% y 10\u2009%.`
        : `Con los pesos actuales obtiene ${formatTenths(tenths[best])} puntos, frente a ${others.join(' y ')} de las otras alternativas.`,
  }
}

