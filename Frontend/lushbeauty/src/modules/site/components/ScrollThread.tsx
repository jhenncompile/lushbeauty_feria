import { useLayoutEffect, useRef, useState } from 'react'
import { motionAllowed } from '../../../shared/motion'

/** Ancho mínimo para que existan márgenes por donde bajar sin tapar el texto. */
const MIN_WIDTH = 1200
/** Punta del cabello en el perfil de la portada (coordenadas del viewBox 40 140 1200 960) y su caja. */
const TAIL = { x: 469, y: 1063 }
const VIEW = { x: 40, y: 140, w: 1200, h: 960 }
/** La cabeza del hilo va a esta fracción de la altura de pantalla. */
const HEAD = 0.62

interface Geometry {
  d: string
  height: number
  /** Tabla y → longitud normalizada, creciente en ambas. */
  ys: number[]
  ls: number[]
}

function pageTop(el: Element) {
  return el.getBoundingClientRect().top + window.scrollY
}
function pageLeft(el: Element) {
  return el.getBoundingClientRect().left + window.scrollX
}

/** Calcula el trazado sobre el diseño actual: del cabello al monograma, bajando por los márgenes. */
function measure(root: HTMLElement): Omit<Geometry, 'ys' | 'ls'> | null {
  const art = root.querySelector<HTMLElement>('[data-thread="start"]')
  const end = root.querySelector<HTMLElement>('[data-thread="end"]')
  const track = root.querySelector<HTMLElement>('.hero-pin')
  const stick = root.querySelector<HTMLElement>('.hero-stick')
  if (!art || !end || !track || !stick) return null
  const W = root.clientWidth
  const rootTop = pageTop(root)
  const rootLeft = pageLeft(root)

  // Punta del cabello, con la portada ya despegada (tope final de la pista) y el arte en su estado final.
  const stickTop = pageTop(track) + track.offsetHeight - stick.offsetHeight - rootTop
  const cx = art.offsetLeft + art.offsetWidth / 2
  const cy = art.offsetTop + art.offsetHeight / 2
  const rawX = art.offsetLeft + ((TAIL.x - VIEW.x) / VIEW.w) * art.offsetWidth
  const rawY = art.offsetTop + ((TAIL.y - VIEW.y) / VIEW.h) * art.offsetHeight
  const sx = cx + (rawX - cx) * 1.035 + (stick.offsetLeft || 0)
  const sy = stickTop + cy + (rawY - cy) * 1.035 - 14

  const ex = pageLeft(end) - rootLeft
  const ey = pageTop(end) - rootTop

  const gap = Math.min(44, Math.max(24, (W - 1200) / 4 + 30))
  const rightX = W - gap
  const leftX = gap

  const tops = Array.from(root.querySelectorAll<HTMLElement>('main > section, [data-thread="foot"]'))
    .map((s) => pageTop(s) - rootTop)
    .filter((t) => t > sy + 260 && t < ey - 160)

  const f = (n: number) => n.toFixed(1)
  let d = `M${f(sx)} ${f(sy)}`
  let side: 'r' | 'l' = 'r'
  let x = sx
  let y = sy
  const run = (toX: number, toY: number, bend: number) => {
    const dy = toY - y
    d += `C${f(x + bend)} ${f(y + dy / 3)} ${f(toX - bend)} ${f(y + (2 * dy) / 3)} ${f(toX)} ${f(toY)}`
    x = toX
    y = toY
  }
  // Primer tramo: del cabello al margen derecho.
  run(rightX, sy + 240, 90)
  // Cruces de lado cada dos fronteras de sección, justo antes de ellas (en el aire de relleno).
  // Número par de cruces: se llega al monograma desde el margen derecho, sin pasar por el titular del cierre.
  const crossings = tops.filter((_, i) => i % 2 === 1)
  if (crossings.length % 2 === 1) crossings.shift()
  crossings.forEach((t) => {
    run(x, t - 150, side === 'r' ? -10 : 10)
    side = side === 'r' ? 'l' : 'r'
    run(side === 'r' ? rightX : leftX, t - 40, 0)
  })
  // Aproximación final al monograma.
  run(x, Math.max(y + 80, ey - 200), side === 'r' ? -12 : 12)
  run(ex, ey, side === 'r' ? -120 : 120)
  return { d, height: root.scrollHeight }
}

/**
 * Hilo que nace de la punta del cabello de la portada y baja con la persona por los márgenes hasta
 * el monograma del cierre. Se dibuja hasta la altura de lectura (`HEAD` de la pantalla) y se adapta
 * al fondo con `mix-blend-mode: difference`. Solo en pantallas anchas; sin movimiento, queda completo.
 */
export function ScrollThread() {
  const svg = useRef<SVGSVGElement>(null)
  const path = useRef<SVGPathElement>(null)
  const pen = useRef<SVGGElement>(null)
  const [geo, setGeo] = useState<Pick<Geometry, 'd' | 'height'> | null>(null)
  const table = useRef<{ ys: number[]; ls: number[]; total: number } | null>(null)

  // Medir el diseño y volver a medir cuando cambie el tamaño del contenido.
  useLayoutEffect(() => {
    const root = svg.current?.parentElement
    if (!root || typeof ResizeObserver === 'undefined') return
    let frame = 0
    const run = () => {
      frame = 0
      if (root.clientWidth < MIN_WIDTH) return setGeo(null)
      setGeo(measure(root))
    }
    const request = () => {
      if (!frame) frame = requestAnimationFrame(run)
    }
    run()
    const observer = new ResizeObserver(request)
    observer.observe(root)
    window.addEventListener('load', request)
    return () => {
      observer.disconnect()
      window.removeEventListener('load', request)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [])

  // Tabla y → longitud y avance con el scroll.
  useLayoutEffect(() => {
    const el = path.current
    const root = svg.current?.parentElement
    if (!el || !root || !geo || typeof el.getTotalLength !== 'function') return
    const total = el.getTotalLength()
    const ys: number[] = []
    const ls: number[] = []
    const N = 480
    let top = -Infinity
    for (let i = 0; i <= N; i++) {
      const pt = el.getPointAtLength((total * i) / N)
      top = Math.max(top, pt.y) // el trazado es casi monótono en y: se fuerza para buscar
      ys.push(top)
      ls.push(i / N)
    }
    table.current = { ys, ls, total }

    const lengthAt = (y: number) => {
      let lo = 0
      let hi = ys.length - 1
      if (y <= ys[0]) return 0
      if (y >= ys[hi]) return 1
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1
        if (ys[mid] <= y) lo = mid
        else hi = mid
      }
      const span = ys[hi] - ys[lo] || 1
      return ls[lo] + ((y - ys[lo]) / span) * (ls[hi] - ls[lo])
    }
    const apply = (frac: number) => {
      el.style.strokeDashoffset = String(1 - frac)
      const node = pen.current
      if (!node) return
      if (frac <= 0.002 || frac >= 0.999) {
        node.style.opacity = '0'
        return
      }
      const pt = el.getPointAtLength(frac * total)
      node.setAttribute('transform', `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`)
      node.style.opacity = '1'
    }

    if (!motionAllowed()) {
      apply(1)
      return
    }
    let frame = 0
    const update = () => {
      frame = 0
      const headY = window.scrollY + window.innerHeight * HEAD - (root.getBoundingClientRect().top + window.scrollY)
      apply(lengthAt(headY))
    }
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', request, { passive: true })
    window.addEventListener('resize', request)
    return () => {
      window.removeEventListener('scroll', request)
      window.removeEventListener('resize', request)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [geo])

  return (
    <svg ref={svg} className="thread" aria-hidden="true" focusable="false" style={{ height: geo?.height ?? 0, display: geo ? 'block' : 'none' }}>
      {geo && <path ref={path} className="thread__line" d={geo.d} pathLength={1} />}
      <g ref={pen} className="thread__pen">
        <circle r="16" className="thread__glow" />
        <circle r="5" className="thread__dot" />
      </g>
    </svg>
  )
}
