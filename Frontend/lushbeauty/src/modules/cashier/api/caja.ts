import { toCents } from '../../../shared/money'
import type { ExpectedByMethod } from '../domain/reconcile'

export class CajaError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

interface ResumenApi { dia: string; por_metodo: Record<string, string> }
export interface CierreApi {
  id: string
  fecha: string
  metodo: string
  esperado: string
  declarado: string
  diferencia: string
  estado: 'CUADRA' | 'FALTA' | 'SOBRA'
  justificacion: string | null
}

const LABEL: Record<string, string> = { EFECTIVO: 'Efectivo', QR: 'QR', TRANSFERENCIA: 'Transferencia', TARJETA: 'Tarjeta' }
const CODE: Record<string, string> = Object.fromEntries(Object.entries(LABEL).map(([code, label]) => [label, code]))

async function request<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(path, { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } })
  } catch {
    throw new CajaError(0, 'No hay conexión con el servidor.')
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { detail?: string }
    throw new CajaError(response.status, body.detail ?? 'El servidor no pudo atender la solicitud.')
  }
  return (await response.json()) as T
}

/** Fecha local en formato ISO (`2026-11-23`), la que espera el API. */
export function isoDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Esperado del día por método. Efectivo, QR y transferencia siempre; tarjeta solo si hubo cobros. */
export async function expectedFor(token: string, day: string): Promise<ExpectedByMethod[]> {
  const days = await request<ResumenApi[]>(`/api/v1/caja/resumen/?desde=${day}&hasta=${day}`, token)
  const byMethod = days.find((d) => d.dia === day)?.por_metodo ?? {}
  return Object.keys(LABEL)
    .map((code) => ({ code, cents: toCents(byMethod[code] ?? '0') }))
    .filter((item) => item.code !== 'TARJETA' || item.cents > 0)
    .map((item) => ({ method: LABEL[item.code], cents: item.cents }))
}

export const listCierres = (token: string) => request<CierreApi[]>('/api/v1/caja/cierres/', token)

export function postCierre(
  token: string,
  day: string,
  declarations: Array<{ method: string; cents: number; justification?: string }>,
) {
  const money = (cents: number) => `${Math.trunc(cents / 100)}.${String(Math.abs(cents % 100)).padStart(2, '0')}`
  return request<CierreApi[]>('/api/v1/caja/cierres/', token, {
    method: 'POST',
    body: JSON.stringify({
      fecha: day,
      declaraciones: declarations.map((d) => ({
        metodo: CODE[d.method],
        declarado: money(d.cents),
        ...(d.justification ? { justificacion: d.justification } : {}),
      })),
    }),
  })
}

export interface CloseSummary { id: string; date: string; note: string; tag: string; tone?: 'ok' }

const bs = (cents: number) => `Bs ${Math.trunc(cents / 100)},${String(Math.abs(cents % 100)).padStart(2, '0')}`

/** Agrupa las filas por día (una por método) en las líneas de «Últimos cierres». */
export function summarizeCierres(rows: CierreApi[], limit = 3): CloseSummary[] {
  const byDay = new Map<string, CierreApi[]>()
  for (const row of rows) byDay.set(row.fecha, [...(byDay.get(row.fecha) ?? []), row])
  return [...byDay.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, limit)
    .map(([day, items]) => {
      const expected = items.reduce((s, r) => s + toCents(r.esperado), 0)
      const declared = items.reduce((s, r) => s + toCents(r.declarado), 0)
      const diff = declared - expected
      const [, month, d] = day.split('-')
      const months = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
      return {
        id: day,
        date: `${Number(d)} ${months[Number(month) - 1]}`,
        note: diff === 0 ? `Esperado ${bs(expected)}` : `Esperado ${bs(expected)} · Contado ${bs(declared)}`,
        tag: diff === 0 ? 'Cuadrado' : `${diff > 0 ? '+' : '−'} ${bs(Math.abs(diff))} justificado`,
        tone: diff === 0 ? ('ok' as const) : undefined,
      }
    })
}
