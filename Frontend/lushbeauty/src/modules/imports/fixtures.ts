/** Datos sintéticos: ninguna planilla real de nómina ni de clientas. */
export const FILE = {
  name: 'Planilla_agosto_2026.xlsx',
  detail: '3 hojas · 91 filas · Una hoja por especialista',
}

export const MAPPING: { source: string; target: string }[] = [
  { source: 'Fecha', target: 'Fecha' },
  { source: 'Cliente', target: 'Cliente' },
  { source: 'Servicio', target: 'Servicio del catálogo' },
  { source: 'Monto', target: 'Precio de lista' },
  { source: 'Descuento', target: 'Descuento' },
  { source: 'Comisión', target: 'No se importa: se recalcula' },
  { source: 'Propina', target: 'Propina' },
]

export interface ReviewItem {
  id: string
  origin: string
  /** Texto tal como está en la planilla. */
  original: string
  proposal: string
  /** Frase para móvil: «… se leerá como …». */
  sentence: string
  reason: string
  /** Si es true, aceptar exige elegir un motivo de descuento. */
  needsReason?: boolean
}

export const REVIEW_ITEMS: ReviewItem[] = [
  { id: 'r1', origin: 'Hoja Marisol · fila 14', original: '« PEDI»', proposal: 'Pedicura', sentence: 'se leerá como', reason: 'Alias conocido del catálogo' },
  { id: 'r2', origin: 'Hoja Paty · fila 9', original: '« KAPPIN»', proposal: 'Kapping', sentence: 'se leerá como', reason: 'Similitud alta; confirme antes de aceptar' },
  { id: 'r3', origin: 'Hoja Marisol · fila 31', original: '« MANI+PEDI+TIPS»', proposal: 'Manicura, Pedicura y Tips', sentence: 'se descompone en', reason: 'Combo descompuesto por regla del catálogo' },
  { id: 'r4', origin: 'Hoja Katherine · fila 22', original: '« MANI GEL» a Bs 112', proposal: 'Manicura gel, Bs 120 con descuento de Bs 8', sentence: 'cobrada a Bs 112; el catálogo indica Bs 120', reason: 'Descuento sin motivo', needsReason: true },
]

/** Las 7 filas restantes, genéricas: el diseño solo detalla 4 de 11. */
export const REMAINING_ITEMS: ReviewItem[] = Array.from({ length: 7 }, (_, index) => ({
  id: `m${index + 1}`,
  origin: `Hoja ${['Paty', 'Marisol', 'Katherine'][index % 3]} · fila ${40 + index * 3}`,
  original: `« SERV ${index + 1}»`,
  proposal: ['Cejas', 'Pestañas', 'Depilación'][index % 3],
  sentence: 'se leerá como',
  reason: 'Alias probable del catálogo; confirme antes de aceptar',
}))

export const DISCOUNT_REASONS = ['Clienta frecuente', 'Promoción', 'Corrección', 'Otro']
