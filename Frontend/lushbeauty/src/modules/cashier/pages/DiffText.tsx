import { formatBs } from '../../../shared/money'
import type { CashStatus } from '../domain/reconcile'

const WORD: Record<CashStatus, string> = { conciliado: 'Conciliado', falta: 'Falta', sobra: 'Sobra' }

/** Diferencia siempre con palabra, nunca solo color. */
export function DiffText({ cents, status }: { cents: number; status: CashStatus }) {
  const tone = status === 'conciliado' ? 'ok' : status === 'falta' ? 'rouge' : undefined
  const amount = status === 'sobra' ? `+ ${formatBs(cents)}` : formatBs(cents)
  return <span className={tone}>{amount} · {WORD[status]}</span>
}
