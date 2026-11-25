import type { Notice, Statement } from './types'

export const WEEK_LABEL = 'Semana 17 – 23 nov 2026'

/** Datos sintéticos del diseño; no son nómina real. */
export const STATEMENTS: Statement[] = [
  {
    id: 'paty',
    name: 'Paty',
    commissionCents: 16100,
    tipsCents: 1500,
    deductionsCents: 3000,
    deductionLabel: 'Adelanto',
    lines: [
      { serviceName: 'Manicura gel', listCents: 12000, discountCents: 800 },
      { serviceName: 'Pedicura', listCents: 10000, discountCents: 0 },
      { serviceName: 'Cejas', listCents: 6000, discountCents: 0 },
      { serviceName: 'Pestañas', listCents: 18000, discountCents: 1000 },
    ],
  },
  { id: 'katherine', name: 'Katherine', commissionCents: 11200, tipsCents: 0, deductionsCents: 0, deductionLabel: 'Deducciones' },
  { id: 'marisol', name: 'Marisol', roleNote: 'administradora', commissionCents: 53900, tipsCents: 2000, deductionsCents: 0, deductionLabel: 'Deducciones' },
]

export const INITIAL_NOTICES: Notice[] = [
  { statementId: 'paty', name: 'Paty', status: 'enviado' },
  {
    statementId: 'katherine',
    name: 'Katherine',
    status: 'error',
    error: 'no se pudo enviar el aviso porque no hay un correo registrado. Agregue el correo y reintente.',
  },
  { statementId: 'marisol', name: 'Marisol', status: 'enviado' },
]
