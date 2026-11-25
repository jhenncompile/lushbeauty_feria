/** Resumen de una importación en revisión. Reglas puras, sin React ni red. */

export type Decision = 'accepted' | 'rejected'

export interface ImportCounts {
  accepted: number
  toReview: number
  rejected: number
}

/** Cifras de partida de la planilla (sintéticas): 91 filas leídas. */
export const BASE_COUNTS: ImportCounts = { accepted: 78, toReview: 11, rejected: 2 }

export function summarize(decisions: Record<string, Decision | undefined>): ImportCounts {
  const values = Object.values(decisions).filter((value): value is Decision => value !== undefined)
  const accepted = values.filter((value) => value === 'accepted').length
  const rejected = values.filter((value) => value === 'rejected').length
  return {
    accepted: BASE_COUNTS.accepted + accepted,
    rejected: BASE_COUNTS.rejected + rejected,
    toReview: BASE_COUNTS.toReview - accepted - rejected,
  }
}

/** Confirmar solo cuando no queda nada por revisar. */
export function canConfirm(counts: ImportCounts): boolean {
  return counts.toReview === 0
}
