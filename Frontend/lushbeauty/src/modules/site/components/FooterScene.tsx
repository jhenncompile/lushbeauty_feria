import { useCallback, useRef, type ReactNode } from 'react'
import { useScrollProgress } from '../../../shared/motion'
import { Backdrop, MARK_DRAW_RANGES, MarkDraw, markPoint } from '../../../shared/ui'

/**
 * Cierre de la página: al llegar, el trazo dibuja el contorno de la L y de la B (con una «pluma»)
 * y luego las rellena de abajo hacia arriba. Es el destino del hilo (`ScrollThread`).
 */
export function FooterScene({ children }: { children: ReactNode }) {
  const lines = useRef<Array<SVGPathElement | null>>([])
  const pen = useRef<SVGGElement>(null)

  const onProgress = useCallback((p: number) => {
    const node = pen.current
    if (!node) return
    const ranges = [MARK_DRAW_RANGES.l, MARK_DRAW_RANGES.b] as const
    const i = ranges.findIndex(([s, e]) => p >= s && p < e)
    const path = i >= 0 ? lines.current[i] : null
    if (i < 0 || !path || typeof path.getTotalLength !== 'function') {
      node.style.opacity = '0'
      return
    }
    const [s, e] = ranges[i]
    const raw = path.getPointAtLength(((p - s) / (e - s)) * path.getTotalLength())
    const pt = markPoint(i as 0 | 1, raw.x, raw.y)
    node.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`)
    node.style.opacity = '1'
  }, [])
  const scene = useScrollProgress<HTMLElement>(onProgress, 'enter')

  return (
    <section className="noir rel foot-scene" data-thread="foot" ref={scene}>
      <Backdrop opacity={0.35} />
      <div className="foot-mark" aria-hidden="true" data-thread="end">
        <MarkDraw height={720} linesRef={lines} penRef={pen} />
      </div>
      {children}
    </section>
  )
}
