import type { TabItem } from '../ui'

/** Rutas de la app. Las constantes viven aquí para que los módulos no se importen entre sí. */
export const ROUTES = {
  login: '/ingresar',
  home: '/hoy',
  register: '/registrar',
  discount: '/registrar/descuento',
  saved: '/registrar/guardado',
  cashClose: '/caja',
  payroll: '/nomina',
  payrollApproved: '/nomina/aprobada',
  myPayroll: '/mi-liquidacion',
  sync: '/sincronizacion',
  webPanel: '/web/panel',
  webSales: '/web/ventas',
  webCash: '/web/caja',
  webPayroll: '/web/nomina',
  webCatalog: '/web/catalogo',
} as const

export const ADMIN_TABS: TabItem[] = [
  { label: 'Hoy', to: ROUTES.home },
  { label: 'Caja', to: ROUTES.cashClose },
  { label: 'Nómina', to: ROUTES.payroll },
  { label: 'Decisiones', to: '/decisiones' },
]

export const SPECIALIST_TABS: TabItem[] = [
  { label: 'Registrar', to: ROUTES.register },
  { label: 'Mi liquidación', to: ROUTES.myPayroll },
]

export const WEB_LINKS: TabItem[] = [
  { label: 'Panel', to: ROUTES.webPanel },
  { label: 'Ventas', to: ROUTES.webSales },
  { label: 'Caja', to: ROUTES.webCash },
  { label: 'Nómina', to: ROUTES.webPayroll },
  { label: 'Decisiones', to: '/web/decisiones' },
]
