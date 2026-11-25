import { animate, stagger } from 'animejs'

/** Movimiento permitido: hay navegador y la persona no pidió reducirlo. */
export function motionAllowed(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const EASE = 'outExpo'

/** Entrada escalonada de bloques: sube 12 px y aparece. Devuelve una función que la detiene. */
export function enter(targets: Element[], options: { delay?: number; step?: number } = {}): () => void {
  if (!motionAllowed() || targets.length === 0) return () => undefined
  const { delay = 60, step = 90 } = options
  const run = animate(targets, {
    opacity: [0, 1],
    translateY: [12, 0],
    duration: 900,
    ease: EASE,
    delay: stagger(step, { start: delay }),
  })
  return () => {
    run.cancel()
    targets.forEach((el) => {
      ;(el as HTMLElement).style.opacity = ''
      ;(el as HTMLElement).style.transform = ''
    })
  }
}

/** Aparece al entrar en pantalla (una sola vez). */
export function revealOnScroll(targets: Element[]): () => void {
  if (!motionAllowed() || targets.length === 0 || typeof IntersectionObserver === 'undefined') return () => undefined
  targets.forEach((el) => {
    ;(el as HTMLElement).style.opacity = '0'
  })
  const seen = new Set<Element>()
  const observer = new IntersectionObserver(
    (entries) => {
      const fresh = entries.filter((e) => e.isIntersecting && !seen.has(e.target))
      if (fresh.length === 0) return
      fresh.forEach((e) => {
        seen.add(e.target)
        observer.unobserve(e.target)
      })
      animate(
        fresh.map((e) => e.target),
        { opacity: [0, 1], translateY: [24, 0], duration: 1100, ease: EASE, delay: stagger(110) },
      )
    },
    { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
  )
  targets.forEach((el) => observer.observe(el))
  return () => {
    observer.disconnect()
    targets.forEach((el) => {
      ;(el as HTMLElement).style.opacity = ''
      ;(el as HTMLElement).style.transform = ''
    })
  }
}

/** Cuenta de 0 al valor final; `render` recibe el valor entero de cada cuadro. El último cuadro es exacto. */
export function countUp(to: number, render: (value: number) => void, duration = 1400): () => void {
  if (!motionAllowed()) {
    render(to)
    return () => undefined
  }
  const state = { value: 0 }
  const run = animate(state, {
    value: to,
    duration,
    ease: EASE,
    onUpdate: () => render(Math.round(state.value)),
    onComplete: () => render(to),
  })
  return () => {
    run.cancel()
    render(to)
  }
}
