export interface AuditEntry {
  at: string
  user: string
  action: string
  record: string
  before: string
  after: string
  reason: string
}

/** Registros ilustrativos (sintéticos). El historial no se edita ni se borra. */
export const ENTRIES: AuditEntry[] = [
  { at: '23 nov 19:48', user: 'Marisol', action: 'Verificó liquidación', record: 'Semana 17 – 23 nov', before: 'Borrador', after: 'Verificada', reason: '—' },
  { at: '23 nov 19:46', user: 'Marisol', action: 'Registró servicio', record: 'Manicura gel · Bs 112', before: '—', after: 'Confirmada', reason: '—' },
  { at: '22 nov 16:02', user: 'Katherine', action: 'Aplicó descuento', record: 'Manicura gel', before: 'Bs 0', after: 'Bs 18 (15 %)', reason: 'Alerta generada' },
  { at: '22 nov 11:20', user: 'Marisol', action: 'Anuló servicio', record: 'Pedicura · Bs 100', before: 'Confirmada', after: 'Anulada', reason: 'Cobro duplicado' },
  { at: '19 nov 10:15', user: 'Marisol', action: 'Ajustó liquidación cerrada', record: 'Semana 10 – 16 nov', before: 'Bs 0', after: 'Bs 30', reason: 'Adelanto omitido' },
]
