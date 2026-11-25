import type { GuardAlert } from './domain/alerts'

export const ALERTS: GuardAlert[] = [
  {
    id: 'a1',
    rule: 'Descuento sobre el límite',
    observed: '15 % (Bs 18 sobre Bs 120)',
    threshold: '10 %',
    origin: 'Manicura gel · Katherine · 22 nov',
    status: 'pending',
  },
  {
    id: 'a2',
    rule: 'Venta sin método de pago',
    observed: 'Pedicura Bs 100, sin método',
    threshold: 'Método obligatorio',
    origin: 'Importación · hoja Paty · fila 7',
    status: 'pending',
  },
  {
    id: 'a3',
    rule: 'Edición de liquidación cerrada',
    observed: 'Ajuste de Bs 30 el 19 nov',
    threshold: 'Sin ediciones tras cierre',
    origin: 'Semana 10 – 16 nov',
    status: 'reviewed',
    reviewedBy: 'Marisol',
  },
]

export const RULES: { name: string; description: string; value?: string; experimental?: boolean }[] = [
  { name: 'Descuento máximo autorizado', description: 'Descuento superior al umbral', value: '10 %' },
  { name: 'Método de pago obligatorio', description: 'Pago sin método registrado' },
  { name: 'Total cobrado frente a pagos asociados', description: 'Discrepancia entre ambos' },
  { name: 'Servicio sin correspondencia en el catálogo', description: 'Texto libre o nombre desconocido' },
  { name: 'Edición posterior al cierre', description: 'Cambios en liquidaciones ya cerradas' },
  { name: 'Reintentos de sincronización con clave repetida', description: 'Envíos duplicados desde el teléfono' },
  { name: 'Detector estadístico', description: 'Prueba de concepto: falta historial validado para desplegarlo', experimental: true },
]
