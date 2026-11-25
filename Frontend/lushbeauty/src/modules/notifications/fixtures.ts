export interface Automation {
  id: string
  name: string
  detail: string
  state: 'Activo' | '1 error'
}

export const AUTOMATIONS: Automation[] = [
  { id: 'n1', name: 'Cierre de caja aprobado', detail: 'Resumen consolidado a la administradora · Último envío 22 nov', state: 'Activo' },
  { id: 'n2', name: 'Liquidación semanal aprobada', detail: 'Comprobante PDF y aviso individual a cada especialista · Último envío 23 nov', state: '1 error' },
  { id: 'n3', name: 'Alerta de revisión', detail: 'Incidencia sin datos salariales innecesarios · Último envío 22 nov', state: 'Activo' },
]
