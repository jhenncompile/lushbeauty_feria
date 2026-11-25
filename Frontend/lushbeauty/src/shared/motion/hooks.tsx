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
