export type SettlementStatus = 'borrador' | 'verificada' | 'aprobada'

export interface StatementLine {
  serviceName: string
  listCents: number
  discountCents: number
}

export interface Statement {
  id: string
  name: string
  roleNote?: string
  /** Comisión guardada con cada venta (snapshot); no se recalcula al cambiar la política. */
  commissionCents: number
  tipsCents: number
  deductionsCents: number
  deductionLabel: string
  /** Detalle por línea; solo algunas especialistas lo tienen en la maqueta. */
  lines?: StatementLine[]
}

export type NoticeStatus = 'enviado' | 'error'

export interface Notice {
  statementId: string
  name: string
  status: NoticeStatus
  error?: string
}
