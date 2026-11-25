/** Datos sintéticos del diseño. El esperado real saldrá de las ventas confirmadas del día (F04-T1). */
export const CLOSE_DATE = '23 nov 2026'

export const EXPECTED = [
  { method: 'Efectivo', cents: 41200 },
  { method: 'QR', cents: 20000 },
  { method: 'Transferencia', cents: 8000 },
]

export const LAST_CLOSES = [
  { id: 'c1', date: '16 nov', note: 'Esperado Bs 410,00', tag: 'Cuadrado', tone: 'ok' as const },
  { id: 'c2', date: '15 nov', note: 'Esperado Bs 580,00 · Contado Bs 585,00', tag: '+ Bs 5,00 justificado', tone: undefined },
  { id: 'c3', date: '14 nov', note: 'Esperado Bs 520,00', tag: 'Cuadrado', tone: 'ok' as const },
]
