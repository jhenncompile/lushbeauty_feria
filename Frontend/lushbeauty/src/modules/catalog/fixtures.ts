import type { CatalogService, IllustrativePolicy } from './types'

export const SERVICES: CatalogService[] = [
  { id: 'manicura-gel', name: 'Manicura gel', description: 'Esmaltado en gel con preparación de la uña.', listPriceCents: 12000, durationMin: 60 },
  { id: 'pedicura', name: 'Pedicura', description: 'Cuidado completo de pies y uñas.', listPriceCents: 10000, durationMin: 60 },
  { id: 'cejas', name: 'Cejas', description: 'Diseño y perfilado.', listPriceCents: 6000, durationMin: 30 },
  { id: 'pestanas', name: 'Pestañas', description: 'Lifting y tratamiento de pestañas.', listPriceCents: 18000, durationMin: 90 },
  { id: 'depilacion', name: 'Depilación', description: 'Según la zona.', listPriceCents: 4000, durationMin: 30 },
  { id: 'little-princess', name: 'Lush Little Princess', description: 'Línea de belleza para niñas.', listPriceCents: 8000, durationMin: 45 },
]

export const ILLUSTRATIVE_POLICY: IllustrativePolicy = {
  commissionBps: 3500,
  commissionBase: 'lista',
  maxDiscountBps: 1000,
}

export const COMBOS = [
  { id: 'combo-1', name: 'Manicura + Pedicura + Tips', lines: 3 },
  { id: 'combo-2', name: 'Lifting + Henna + Cejas', lines: 3 },
]
