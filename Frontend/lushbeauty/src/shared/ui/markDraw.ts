/** Tramos (0–1 de `--p`) en que el trazo avanza por cada letra del monograma y luego se rellena. */
export const MARK_DRAW_RANGES = { l: [0, 0.4], b: [0.3, 0.75], fill: [0.7, 1] } as const

/** Lleva un punto de un trazo (coordenadas del path) al espacio del monograma; `i` 0 = L, 1 = B. */
export function markPoint(i: 0 | 1, x: number, y: number): { x: number; y: number } {
  return i === 0 ? { x: x - 84, y: 700 - y } : { x: x + 223, y: 700 - y }
}
