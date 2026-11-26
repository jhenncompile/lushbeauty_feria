/** Geometría del hilo: una pincelada de grosor variable (fina → llena → fina), pura y sin DOM. */

export interface Pt {
  x: number
  y: number
}

export interface Sampled {
  pts: Pt[]
  /** Longitud acumulada hasta cada punto (px). */
  len: number[]
  total: number
}

/** Spline Catmull-Rom centrípeta por los puntos dados, muestreada cada ~`step` px (sin esquinas). */
export function sampleSpline(through: Pt[], step = 8): Sampled {
  const pts: Pt[] = []
  const n = through.length
  if (n < 2) return { pts: [...through], len: [0], total: 0 }
  const at = (i: number) => through[Math.min(n - 1, Math.max(0, i))]
  const knot = (t: number, a: Pt, b: Pt) => t + Math.pow(Math.hypot(b.x - a.x, b.y - a.y) || 1, 0.5)
  for (let i = 0; i < n - 1; i++) {
    // Extremos: se refleja el vecino para no inventar curvatura en los bordes.
    const p1 = at(i)
    const p2 = at(i + 1)
    const p0 = i === 0 ? { x: 2 * p1.x - p2.x, y: 2 * p1.y - p2.y } : at(i - 1)
    const p3 = i + 2 >= n ? { x: 2 * p2.x - p1.x, y: 2 * p2.y - p1.y } : at(i + 2)
    const t0 = 0
    const t1 = knot(t0, p0, p1)
    const t2 = knot(t1, p1, p2)
    const t3 = knot(t2, p2, p3)
    const count = Math.max(2, Math.ceil(Math.hypot(p2.x - p1.x, p2.y - p1.y) / step))
    for (let k = i === 0 ? 0 : 1; k <= count; k++) {
      const t = t1 + ((t2 - t1) * k) / count
      const lerp = (a: Pt, b: Pt, ta: number, tb: number): Pt => ({ x: a.x + ((b.x - a.x) * (t - ta)) / (tb - ta), y: a.y + ((b.y - a.y) * (t - ta)) / (tb - ta) })
      const a1 = lerp(p0, p1, t0, t1)
      const a2 = lerp(p1, p2, t1, t2)
      const a3 = lerp(p2, p3, t2, t3)
      const b1 = lerp(a1, a2, t0, t2)
      const b2 = lerp(a2, a3, t1, t3)
      pts.push(lerp(b1, b2, t1, t2))
    }
  }
  const len = [0]
  for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y))
  return { pts, len, total: len[len.length - 1] }
}

const smooth = (t: number) => {
  const c = Math.min(1, Math.max(0, t))
  return c * c * (3 - 2 * c)
}

export interface BrushOptions {
  /** Grosor máximo (px). */
  max?: number
  /** Longitud (px) del afilado en el arranque, en la llegada y en la cabeza. */
  tail?: number
  end?: number
  head?: number
}

/** Grosor en la posición `s` (px desde el inicio) cuando la cabeza del trazo va por `headS`. */
export function brushWidth(s: number, total: number, headS: number, o: BrushOptions = {}): number {
  const { max = 4.6, tail = 240, end = 170, head = 120 } = o
  const pressure = 0.74 + 0.26 * Math.sin(s / 330 + 0.8)
  return max * pressure * smooth(s / tail) * smooth((total - s) / end) * smooth((headS - s) / head)
}

/** Primer índice con longitud acumulada ≥ `s`. */
export function indexAt(len: number[], s: number): number {
  let lo = 0
  let hi = len.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >> 1
    if (len[mid] < s) lo = mid + 1
    else hi = mid
  }
  return lo
}

/**
 * Contorno relleno de la pincelada entre las longitudes `from` y `headS` (la cabeza acaba en punta).
 * Devuelve '' si no hay nada que dibujar.
 */
export function brushPath(path: Sampled, from: number, headS: number, o: BrushOptions = {}): string {
  const { pts, len, total } = path
  const i0 = Math.max(0, indexAt(len, from) - 1)
  const i1 = Math.min(pts.length - 1, indexAt(len, headS))
  if (i1 - i0 < 2) return ''
  const left: string[] = []
  const right: string[] = []
  for (let i = i0; i <= i1; i++) {
    const a = pts[Math.max(0, i - 1)]
    const b = pts[Math.min(pts.length - 1, i + 1)]
    const dx = b.x - a.x
    const dy = b.y - a.y
    const norm = Math.hypot(dx, dy) || 1
    const half = brushWidth(len[i], total, headS, o) / 2
    const nx = (-dy / norm) * half
    const ny = (dx / norm) * half
    left.push(`${(pts[i].x + nx).toFixed(1)} ${(pts[i].y + ny).toFixed(1)}`)
    right.push(`${(pts[i].x - nx).toFixed(1)} ${(pts[i].y - ny).toFixed(1)}`)
  }
  return `M${left.join('L')}L${right.reverse().join('L')}Z`
}
