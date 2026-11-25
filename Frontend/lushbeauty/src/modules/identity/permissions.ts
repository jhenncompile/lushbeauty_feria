/** Matriz de permisos por rol (datos de ejemplo). La administradora también registra como especialista. */
export const PERMISSION_COLUMNS = [
  'Registrar servicios',
  'Ver su liquidación',
  'Ver nómina ajena',
  'Aprobar y configurar',
  'Reportes',
] as const

export interface UserRow {
  name: string
  role: string
  permissions: string[]
  disabled?: boolean
}

export const USERS: UserRow[] = [
  { name: 'Marisol', role: 'Administradora y especialista', permissions: ['Sí', 'Sí', 'Sí', 'Sí', 'Sí'] },
  { name: 'Paty', role: 'Especialista', permissions: ['Sí', 'Sí', 'No', 'No', 'No'] },
  { name: 'Katherine', role: 'Especialista', permissions: ['Sí', 'Sí', 'No', 'No', 'No'] },
  { name: 'Contador', role: 'Lector de reportes · Sin habilitar', permissions: ['No', 'No', 'No', 'No', 'Solo agregados'], disabled: true },
]
