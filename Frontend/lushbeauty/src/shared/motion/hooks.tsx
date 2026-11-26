import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { countUp, enter, motionAllowed, revealOnScroll } from './motion'

/** Entrada escalonada de los hijos directos del contenedor (con animejs). */
export function useEnter<T extends HTMLElement>(selector = ':scope > *') {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    return enter(Array.from(node.querySelectorAll(selector)))
  }, [selector])
  return ref
}

/** Los elementos `.reveal` del contenedor aparecen al llegar a la vista. */
export function useReveal<T extends HTMLElement>(selector = '.reveal') {
  const ref = useRef<T>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    return revealOnScroll(Array.from(node.querySelectorAll(selector)))
  }, [selector])
  return ref
}

/** Valor en centavos que se anima de 0 al final; fuera de movimiento, el valor llega directo. */
export function useCountUp(target: number, duration?: number): number {
  const [value, setValue] = useState(() => (motionAllowed() ? 0 : target))
  useEffect(() => countUp(target, setValue, duration), [target, duration])
  return value
}

/**
 * Progreso 0–1 del scroll a través de un bloque, escrito como `--p` en el propio elemento para que
 * el CSS lo use. En pantallas anchas el bloque es una pista alta con contenido fijo (pin): avanza
 * mientras la pista pasa. En pantallas angostas avanza mientras el bloque sale de la vista.
 * Sin movimiento (preferencia del sistema) queda en 1: todo visible y completo.
 */
export function useScrollProgress<T extends HTMLElement>(onProgress?: (p: number) => void) {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    if (!motionAllowed()) {
      node.style.setProperty('--p', '1')
      onProgress?.(1)
      return
    }
    let frame = 0
    const update = () => {
      frame = 0
      const box = node.getBoundingClientRect()
      const pinned = window.matchMedia('(min-width: 1001px)').matches
      const span = pinned ? box.height - window.innerHeight : box.height * 0.4
      const p = span > 0 ? Math.min(1, Math.max(0, -box.top / span)) : 1
      node.style.setProperty('--p', p.toFixed(4))
      onProgress?.(p)
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
  }, [onProgress])
  return ref
}
