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
  payrollDetail: '/nomina/:id',
  myPayroll: '/mi-liquidacion',
  sync: '/sincronizacion',
  webPanel: '/web/panel',
  webSales: '/web/ventas',
  webCash: '/web/caja',
  webPayroll: '/web/nomina',
  webCatalog: '/web/catalogo',
  webSettings: '/web/ajustes',
  webAudit: '/web/auditoria',
  webImport: '/web/importar',
  webInsight: '/web/insight',
  webGuard: '/web/guard',
  webDecisions: '/web/decisiones',
  landing: '/inicio',
  fair: '/feria',
  import: '/importar',
  importReview: '/importar/revisar',
  insight: '/insight',
  guard: '/guard',
  decisions: '/decisiones',
  comparison: '/decisiones/comparacion',
  recommendation: '/decisiones/recomendacion',
  history: '/decisiones/historial',
} as const

export function payrollDetailRoute(id: string): string {
  return `/nomina/${id}`
}

export const ADMIN_TABS: TabItem[] = [
  { label: 'Hoy', to: ROUTES.home },
  { label: 'Caja', to: ROUTES.cashClose },
  { label: 'Nómina', to: ROUTES.payroll },
  { label: 'Decisiones', to: ROUTES.decisions },
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
  { label: 'Decisiones', to: ROUTES.webDecisions },
]
