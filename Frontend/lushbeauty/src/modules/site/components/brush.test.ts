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
