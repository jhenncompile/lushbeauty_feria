import { describe, expect, it } from 'vitest'
import { brushPath, brushWidth, indexAt, sampleSpline } from './brush'

const S = sampleSpline([{ x: 0, y: 0 }, { x: 100, y: 300 }, { x: 0, y: 700 }, { x: 100, y: 1100 }], 8)

describe('pincelada del hilo', () => {
  it('la spline pasa por los puntos dados y su longitud crece sin saltos', () => {
    expect(S.pts[0]).toEqual({ x: 0, y: 0 })
    const last = S.pts[S.pts.length - 1]
    expect(Math.hypot(last.x - 100, last.y - 1100)).toBeLessThan(0.01)
    const gaps = S.len.slice(1).map((v, i) => v - S.len[i])
    expect(Math.max(...gaps)).toBeLessThan(12)
    expect(S.total).toBeGreaterThan(1100)
  })

  it('es fina en el arranque y la llegada, y llena en medio', () => {
    expect(brushWidth(0, S.total, S.total)).toBe(0)
    expect(brushWidth(S.total, S.total, S.total)).toBe(0)
    expect(brushWidth(S.total / 2, S.total, S.total)).toBeGreaterThan(2.5)
  })

  it('la cabeza termina en punta: el grosor se anula en `headS`', () => {
    const head = S.total / 2
    expect(brushWidth(head, S.total, head)).toBe(0)
    expect(brushWidth(head - 150, S.total, head)).toBeGreaterThan(1.5)
  })

  it('el contorno es un polígono cerrado sin NaN y vacío si no hay recorrido', () => {
    const d = brushPath(S, 0, S.total / 2)
    expect(d.startsWith('M')).toBe(true)
    expect(d.endsWith('Z')).toBe(true)
    expect(d).not.toMatch(/NaN|Infinity/)
    expect(brushPath(S, 0, 0)).toBe('')
  })

  it('indexAt encuentra la posición por longitud', () => {
    expect(indexAt(S.len, 0)).toBe(0)
    expect(S.len[indexAt(S.len, 500)]).toBeGreaterThanOrEqual(500)
  })
})

import { loopPoints, ringPoints, RING_BRUSH } from './brush'

describe('rulos y aros', () => {
  it('el rulo termina en la vertical de inicio, más abajo, y se cruza a sí mismo', () => {
    const pts = loopPoints({ x: 100, y: 0 }, 36, 1)
    expect(pts[0]).toEqual({ x: 100, y: 0 })
    const end = pts[pts.length - 1]
    expect(Math.abs(end.x - 100)).toBeLessThan(0.001)
    expect(end.y).toBeGreaterThan(100)
    expect(pts.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true)
    // «y» retrocede en algún punto: hay lazo.
    expect(pts.some((p, i) => i > 0 && p.y < pts[i - 1].y)).toBe(true)
    expect(Math.max(...pts.map((p) => p.x))).toBeGreaterThan(160)
  })

  it('el rulo hacia la izquierda es el espejo del de la derecha', () => {
    const a = loopPoints({ x: 100, y: 0 }, 30, 1)
    const b = loopPoints({ x: 100, y: 0 }, 30, -1)
    a.forEach((p, i) => {
      expect(b[i].x - 100).toBeCloseTo(-(p.x - 100), 6)
      expect(b[i].y).toBeCloseTo(p.y, 6)
    })
  })

  it('el aro rodea la caja con holgura, es determinista y sobrepasa el inicio', () => {
    const box = { x: 200, y: 100, w: 180, h: 50 }
    const a = ringPoints(box, { seed: 3 })
    const b = ringPoints(box, { seed: 3 })
    expect(a).toEqual(b)
    // Ningún punto cae dentro de la caja: el aro no toca el texto.
    const gap = (p: { x: number; y: number }) => Math.hypot(Math.max(box.x - p.x, 0, p.x - (box.x + box.w)), Math.max(box.y - p.y, 0, p.y - (box.y + box.h)))
    expect(a.every((p) => gap(p) >= 2.5)).toBe(true)
    expect(Math.hypot(a[a.length - 1].x - a[0].x, a[a.length - 1].y - a[0].y)).toBeGreaterThan(2)
    const ring = sampleSpline(a, 6)
    expect(brushWidth(0, ring.total, ring.total, RING_BRUSH)).toBe(0)
    expect(brushWidth(ring.total, ring.total, ring.total, RING_BRUSH)).toBe(0)
    expect(brushWidth(ring.total / 2, ring.total, ring.total, RING_BRUSH)).toBeGreaterThan(1.5)
  })
})
