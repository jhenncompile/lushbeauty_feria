import { useLayoutEffect, useRef, useState } from 'react'
import { motionAllowed } from '../../../shared/motion'
import { brushPath, indexAt, loopPoints, RING_BRUSH, ringPoints, sampleSpline, type Pt, type Sampled } from './brush'

/** Ancho mínimo para que existan márgenes por donde bajar sin tapar el texto. */
const MIN_WIDTH = 1200
/** Punta del cabello en el perfil de la portada (coordenadas del viewBox 40 140 1200 960) y su caja. */
const TAIL = { x: 469, y: 1063 }
const VIEW = { x: 40, y: 140, w: 1200, h: 960 }
/** La cabeza del hilo va a esta fracción de la altura de pantalla. */
const HEAD = 0.62

interface Ring {
  pts: Pt[]
  /** Altura de página a la que empieza a dibujarse. */
  atY: number
}

interface Geometry {
  /** Puntos por los que pasa la cinta (la spline los suaviza). */
  through: Pt[]
  /** Aros a mano alrededor de las palabras marcadas con `data-ring`. */
  rings: Ring[]
  height: number
}

/** Posición de un elemento respecto de `root`, sin contar transformaciones (las entradas `.reveal` desplazan el rect). */
function offsetIn(el: HTMLElement, root: HTMLElement) {
  let x = 0
  let y = 0
  let node: HTMLElement | null = el
  while (node && node !== root) {
    x += node.offsetLeft
    y += node.offsetTop
    node = node.offsetParent as HTMLElement | null
  }
  return { x, y }
}

/** La cabeza persigue al objetivo recorriendo esta fracción de la distancia por cuadro. */
const EASE = 0.16

function pageTop(el: Element) {
  return el.getBoundingClientRect().top + window.scrollY
}
function pageLeft(el: Element) {
  return el.getBoundingClientRect().left + window.scrollX
}

/** Alto ocupado por el contenido real de una sección (sin fondos ni adornos absolutos), en coordenadas de `root`. */
function contentBounds(section: HTMLElement, root: HTMLElement): { top: number; bottom: number } {
  const own = offsetIn(section, root)
  let top = Infinity
  let bottom = -Infinity
  if (!section.closest('[aria-hidden="true"]')) {
    section.querySelectorAll<HTMLElement>('*').forEach((el) => {
      if (el.closest('[aria-hidden="true"]') || !el.offsetHeight || !el.offsetWidth) return
      const pos = getComputedStyle(el).position
      if (pos === 'absolute' || pos === 'fixed') return
      const o = offsetIn(el, root)
      top = Math.min(top, o.y)
      bottom = Math.max(bottom, o.y + el.offsetHeight)
    })
  }
  return Number.isFinite(top) ? { top, bottom } : { top: own.y, bottom: own.y + section.offsetHeight }
}

/** Calcula el trazado sobre el diseño actual: del cabello al monograma, bajando por los márgenes. */
function measure(root: HTMLElement): Geometry | null {
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

  const gap = Math.min(52, Math.max(28, (W - 1200) / 4 + 34))
  const rightX = W - gap
  const leftX = gap

  // Huecos de aire entre el contenido de una sección y el de la siguiente: por ahí cruza la cinta de un margen al otro.
  const sections = Array.from(root.querySelectorAll<HTMLElement>('main > section, [data-thread="foot"]'))
  const bounds = sections.map((sec) => contentBounds(sec, root))
  const gaps = bounds
    .slice(1)
    .map((next, i) => ({ y0: bounds[i].bottom + 28, y1: next.top - 28 }))
    .filter((g) => g.y1 - g.y0 >= 70 && g.y0 > sy + 700 && g.y1 < ey - 500)

  // Cinta: baja pegada a un margen y cruza al otro en el aire entre secciones, en una «S» larga.
  const through: Pt[] = [{ x: sx, y: sy }, { x: sx + (rightX - sx) * 0.7, y: sy + 120 }, { x: rightX, y: sy + 300 }]
  let side: 'r' | 'l' = 'r'
  const last = () => through[through.length - 1]
  // Número par de cruces: se llega al monograma desde el margen derecho, sin pasar por el titular del cierre.
  const crossings = gaps.filter((_, i) => i % 2 === 1)
  if (crossings.length % 2 === 1) crossings.shift()
  const radius = Math.min(38, Math.max(20, (W - 1200) / 8 + 22))
  crossings.forEach((g, i) => {
    const from = Math.max(last().y + 140, g.y0)
    if (from > g.y1 - 60) return
    // Rulo a mitad de la bajada por el margen (cada dos tramos), hacia el interior.
    const run = from - last().y
    if (i % 2 === 0 && run > 520) {
      const at = { x: last().x, y: last().y + run * 0.45 }
      through.push(at, ...loopPoints(at, radius, side === 'r' ? -1 : 1).slice(1))
    }
    through.push({ x: last().x, y: from })
    side = side === 'r' ? 'l' : 'r'
    through.push({ x: side === 'r' ? rightX : leftX, y: g.y1 })
  })
  through.push({ x: last().x, y: Math.max(last().y + 140, ey - 330) })
  through.push({ x: ex, y: ey })
  const rings: Ring[] = Array.from(root.querySelectorAll<HTMLElement>('[data-ring]')).map((el, i) => {
    const o = offsetIn(el, root)
    // La caja de un `<span>` en línea abarca todo el interlineado; el aro solo debe rodear las letras (mayúscula a base).
    const font = parseFloat(getComputedStyle(el).fontSize) || 32
    const h = font * 0.72
    const box = { x: o.x, y: o.y + (el.offsetHeight - h) / 2 + font * 0.05, w: el.offsetWidth, h }
    return { pts: ringPoints(box, { seed: i * 2.7 + 1, tilt: i % 2 ? 2.5 : -3, padX: font * 0.5, padY: font * 0.2 }), atY: box.y - 80 }
  })
  return { through, rings, height: root.scrollHeight }
}

/**
 * Hilo que nace de la punta del cabello de la portada y baja con la persona por los márgenes hasta
 * el monograma del cierre, como una pincelada de grosor variable igual que la silueta. La cabeza va
 * a la altura de lectura (`HEAD` de la pantalla) con inercia y acaba en punta; el color se adapta
 * al fondo con `mix-blend-mode: difference`. Solo en pantallas anchas; sin movimiento, queda completo.
 */
export function ScrollThread() {
  const svg = useRef<SVGSVGElement>(null)
  const brush = useRef<SVGPathElement>(null)
  const ringEls = useRef<Array<SVGPathElement | null>>([])
  const [geo, setGeo] = useState<Geometry | null>(null)

  // Medir el diseño y volver a medir cuando cambie el tamaño del contenido.
  useLayoutEffect(() => {
    const root = svg.current?.parentElement
    if (!root || typeof ResizeObserver === 'undefined') return
    let frame = 0
    const run = () => {
      frame = 0
      setGeo(root.clientWidth < MIN_WIDTH ? null : measure(root))
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

  // La cabeza del hilo sigue la altura de lectura, con inercia; solo se dibuja lo que está a la vista.
  useLayoutEffect(() => {
    const el = brush.current
    const root = svg.current?.parentElement
    if (!el || !root || !geo) return
    const curve: Sampled = sampleSpline(geo.through, 7)
    // y → longitud: la cinta baja siempre, se fuerza la monotonía para poder buscar.
    const ys: number[] = []
    let top = -Infinity
    for (const pt of curve.pts) ys.push((top = Math.max(top, pt.y)))
    const lengthAt = (y: number) => {
      if (y <= ys[0]) return 0
      if (y >= ys[ys.length - 1]) return curve.total
      let lo = 0
      let hi = ys.length - 1
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1
        if (ys[mid] <= y) lo = mid
        else hi = mid
      }
      const span = ys[hi] - ys[lo] || 1
      return curve.len[lo] + ((y - ys[lo]) / span) * (curve.len[hi] - curve.len[lo])
    }
    const rings = geo.rings.map((r) => sampleSpline(r.pts, 6))
    const seen: number[] = rings.map(() => -1)
    /** Cada aro se dibuja a lo largo de ~260 px de bajada de la cabeza, desde `atY`. */
    const drawRings = (headY: number, force = false) => {
      rings.forEach((ring, i) => {
        const node = ringEls.current[i]
        if (!node) return
        const p = Math.min(1, Math.max(0, (headY - geo.rings[i].atY) / 260))
        if (!force && p === seen[i]) return
        seen[i] = p
        node.setAttribute('d', p <= 0 ? '' : brushPath(ring, 0, p * (ring.total + RING_BRUSH.head!), RING_BRUSH))
        node.style.setProperty('--b', RING_BRUSH.max!.toString())
      })
    }
    const draw = (headS: number) => {
      const viewTop = window.scrollY - (root.getBoundingClientRect().top + window.scrollY) - 400
      el.setAttribute('d', brushPath(curve, lengthAt(viewTop), headS))
      drawRings(ys[Math.min(ys.length - 1, indexAt(curve.len, headS))])
    }

    if (!motionAllowed()) {
      el.setAttribute('d', brushPath(curve, 0, curve.total + 1))
      drawRings(Infinity, true)
      return
    }
    const target = () => lengthAt(window.scrollY + window.innerHeight * HEAD - (root.getBoundingClientRect().top + window.scrollY))
    let frame = 0
    let shown = target()
    const tick = () => {
      frame = 0
      const goal = target()
      const gap = goal - shown
      shown = Math.abs(gap) < 0.4 ? goal : shown + gap * EASE
      draw(shown)
      if (shown !== goal) frame = requestAnimationFrame(tick)
    }
    const request = () => {
      if (!frame) frame = requestAnimationFrame(tick)
    }
    draw(shown)
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
      {geo && <path ref={brush} className="thread__brush" />}
      {geo?.rings.map((r, i) => (
        <path key={`${r.atY}-${i}`} ref={(n) => { ringEls.current[i] = n }} className="thread__brush thread__ring" />
      ))}
    </svg>
  )
}
