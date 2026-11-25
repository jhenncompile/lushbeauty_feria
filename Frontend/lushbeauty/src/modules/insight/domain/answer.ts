/**
 * Respuestas de Lush Insight: consulta de solo lectura sobre cifras ya calculadas.
 * Si no hay datos para responder, dice «Información insuficiente»; nunca inventa una cifra.
 */

export interface AnswerRow {
  title: string
  detail: string
  value: string
}

export type Answer =
  | { kind: 'rows'; rows: AnswerRow[]; summary: string; report: string }
  | { kind: 'insufficient'; reason: string; next?: { label: string; to: 'decisions' } }

const DISCOUNTS: Answer = {
  kind: 'rows',
  rows: [
    { title: 'Pestañas', detail: '3 servicios', value: 'Bs 60' },
    { title: 'Manicura gel', detail: '5 servicios', value: 'Bs 40' },
    { title: 'Cejas', detail: '2 servicios', value: 'Bs 14' },
  ],
  summary: 'Total de descuentos de la semana: Bs 114. Ilustrativo.',
  report: 'Abrir reporte: descuentos por servicio, 17 – 23 nov',
}

const QR: Answer = {
  kind: 'rows',
  rows: [{ title: 'QR', detail: 'Semana 17 – 23 nov', value: 'Bs 700' }],
  summary: 'Cobrado por QR en la semana, sin registros por confirmar. Ilustrativo.',
  report: 'Abrir reporte: pagos por método, 17 – 23 nov',
}

const NET_PROFIT: Answer = {
  kind: 'insufficient',
  reason:
    'Faltan los costos de octubre, así que no se puede calcular una utilidad neta. Indique un período con costos registrados o ingréselos en Decision Studio.',
  next: { label: 'Ir a Decision Studio', to: 'decisions' },
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')

export const SUGGESTED = [
  'Resumen de caja por período',
  'Pagos por método',
  'Composición de una liquidación',
  'Comparar políticas de comisión',
  'Movimientos que necesitan revisión',
]

export function answerQuestion(question: string): Answer {
  const text = normalize(question)
  if (/descuento/.test(text)) return DISCOUNTS
  if (/\bqr\b/.test(text) || /pagos por metodo/.test(text)) return QR
  if (/utilidad/.test(text)) return NET_PROFIT
  return {
    kind: 'insufficient',
    reason:
      'Esa pregunta no corresponde a ningún reporte disponible. Elija una de las preguntas disponibles o reformúlela con un período.',
  }
}
