import type { QueueItem } from './types'

/** Cola de ejemplo del diseño (datos sintéticos). Se usa en demos y pruebas, no al arrancar la app. */
export const SAMPLE_QUEUE: QueueItem[] = [
  { id: 'q1', label: 'Manicura gel · Marisol', timeLabel: 'Hoy 19:46', amountCents: 11200, status: 'pendiente' },
  { id: 'q2', label: 'Pedicura · Paty', timeLabel: 'Hoy 19:21', amountCents: 10000, status: 'pendiente' },
  { id: 'q3', label: 'Cejas · Katherine', timeLabel: 'Hoy 18:58', amountCents: 6000, status: 'pendiente' },
  { id: 'q4', label: 'Pestañas · Paty', timeLabel: 'Hoy 18:30', amountCents: 17000, status: 'confirmada' },
  {
    id: 'q5',
    label: 'Depilación · Katherine',
    timeLabel: 'Hoy 18:05',
    amountCents: 4000,
    status: 'revision',
    error: 'el catálogo cambió el precio mientras no había conexión. Confirme el importe para reenviarlo.',
  },
]
