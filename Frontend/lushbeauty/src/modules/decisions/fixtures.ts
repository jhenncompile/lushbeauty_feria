import type { Criterion } from './domain/matrix'
import type { ScenarioInput } from './domain/simulation'

/** Datos sintéticos e ilustrativos. Los volúmenes y los puntajes son supuestos de la administradora. */
export const DEFAULT_SCENARIO: ScenarioInput = {
  listCents: 12000,
  materialsCents: 2000,
  commissionBps: 3500,
  servicesPerWeek: 100,
}

export const CRITERIA: Criterion[] = [
  { id: 'contribution', name: 'Contribución', weightPct: 50, scores: [10, 8, 6] },
  { id: 'attraction', name: 'Atracción de clientas', weightPct: 30, scores: [3, 6, 8] },
  { id: 'simplicity', name: 'Simplicidad de comisión', weightPct: 20, scores: [10, 8, 8] },
]

/** Pesos de la prueba de sensibilidad: la atracción de clientas pasa a pesar 50 %. */
export const SENSITIVITY_WEIGHTS: Record<string, number> = { contribution: 30, attraction: 50, simplicity: 20 }

export const ALTERNATIVE_LABELS = ['Mantener', '5 %', '10 %']

export interface ServiceContribution {
  service: string
  chargedCents: number
  commissionCents: number
  /** null = sin costo registrado: no se calcula la contribución ni se estima. */
  materialsCents: number | null
}

export const CONTRIBUTIONS: ServiceContribution[] = [
  { service: 'Manicura gel', chargedCents: 12000, commissionCents: 4200, materialsCents: 2000 },
  { service: 'Pedicura', chargedCents: 10000, commissionCents: 3500, materialsCents: null },
  { service: 'Cejas', chargedCents: 6000, commissionCents: 2100, materialsCents: null },
  { service: 'Pestañas', chargedCents: 18000, commissionCents: 6300, materialsCents: null },
]

export interface DecisionRecord {
  code: string
  title: string
  owner: string
  date: string
  expected: string
  review: string
  status: 'Aprobada'
}

export const DECISIONS: DecisionRecord[] = [
  {
    code: 'DEC-01',
    title: 'Mantener el precio de Manicura gel',
    owner: 'Marisol',
    date: '23 nov 2026',
    expected: 'Bs 5.800 por semana',
    review: '7 dic 2026 · Pendiente',
    status: 'Aprobada',
  },
]

export const ASSUMPTIONS: { text: string; kind: 'Supuesto' | 'Dato' }[] = [
  { text: '100 servicios por semana', kind: 'Supuesto' },
  { text: 'Materiales de Bs 20 por servicio', kind: 'Supuesto' },
  { text: 'Comisión de 35 % sobre lista', kind: 'Dato' },
  { text: 'Puntajes de atracción', kind: 'Supuesto' },
]
