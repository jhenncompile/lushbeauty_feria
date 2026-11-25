/** Matriz multicriterio: puntaje ponderado de 0 a 10 con pesos en porcentaje entero. Sin React ni red. */

export interface Criterion {
  id: string
  name: string
  weightPct: number
  /** Puntaje de 0 a 10 por alternativa, en el mismo orden que las alternativas. */
  scores: number[]
}

export function weightsTotal(criteria: Criterion[]): number {
  return criteria.reduce((total, criterion) => total + criterion.weightPct, 0)
}

/** Puntajes en décimas (79 = 7,9), para no usar decimales de punto flotante. */
export function weightedTenths(criteria: Criterion[], weights?: Record<string, number>): number[] {
  const alternatives = criteria[0]?.scores.length ?? 0
  return Array.from({ length: alternatives }, (_, index) => {
    const sum = criteria.reduce(
      (total, criterion) => total + criterion.scores[index] * (weights?.[criterion.id] ?? criterion.weightPct),
      0,
    )
    return Math.floor((sum + 5) / 10)
  })
}

export function formatTenths(tenths: number): string {
  return `${Math.floor(tenths / 10)},${tenths % 10}`
}

export function bestIndex(tenths: number[]): number {
  return tenths.reduce((best, value, index) => (value > tenths[best] ? index : best), 0)
}
