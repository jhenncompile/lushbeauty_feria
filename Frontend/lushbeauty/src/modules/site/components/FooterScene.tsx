import type { ReactNode } from 'react'
import { useScrollProgress } from '../../../shared/motion'
import { Backdrop, MarkDraw } from '../../../shared/ui'

/**
 * Cierre de la página: al llegar, el trazo dibuja el contorno de la L y de la B y luego las rellena
 * de abajo hacia arriba, con inercia suave. Es el destino del hilo (`ScrollThread`).
 */
export function FooterScene({ children }: { children: ReactNode }) {
  const scene = useScrollProgress<HTMLElement>(undefined, 'enter', 0.16)
  return (
    <section className="noir rel foot-scene" data-thread="foot" ref={scene}>
      <Backdrop opacity={0.35} />
      <div className="foot-mark" aria-hidden="true" data-thread="end">
        <MarkDraw height={720} />
      </div>
      {children}
    </section>
  )
}
