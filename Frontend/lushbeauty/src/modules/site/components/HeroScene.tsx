import { useCallback, useRef, type ReactNode } from 'react'
import { useScrollProgress } from '../../../shared/motion'
import { PROFILE_DRAW, PROFILE_FILL, TOOLS_SVG } from './heroArt'

const MASK_ID = 'hero-profile-mask'

/** Una línea visual del título (oculta a lectores: el h1 lleva el texto completo en `aria-label`): se ve como contorno y el trazo la va rellenando, de `start` a `end` del scroll. */
export function InkLine({ children, start, end, tone }: { children: string; start: number; end: number; tone: string }) {
  return (
    <span className="ink-row display-2xl" aria-hidden="true" style={{ '--s': start, '--e': end, '--tone': tone } as React.CSSProperties}>
      <span className="ink-base">{children}</span>
      <span className="ink-fill">{children}</span>
      <i className="ink-pen" />
    </span>
  )
}

/**
 * Portada: el perfil se dibuja con el scroll (el trazo avanza línea por línea y una «pluma» lo
 * recorre), luego aparecen los utensilios y el trazo repasa el título. En escritorio la escena queda
 * fija mientras dura; sin movimiento, todo se ve completo.
 */
export function HeroScene({ children }: { children: ReactNode }) {
  const lines = useRef<Array<SVGPathElement | null>>([])
  const pen = useRef<SVGGElement>(null)

  const onProgress = useCallback((p: number) => {
    const node = pen.current
    if (!node) return
    const active = PROFILE_DRAW.findIndex((seg) => p >= seg.s && p < seg.e)
    const path = active >= 0 ? lines.current[active] : null
    if (!path || typeof path.getTotalLength !== 'function') {
      node.style.opacity = '0'
      return
    }
    const seg = PROFILE_DRAW[active]
    const point = path.getPointAtLength(((p - seg.s) / (seg.e - seg.s)) * path.getTotalLength())
    node.setAttribute('transform', `translate(${point.x.toFixed(1)} ${point.y.toFixed(1)})`)
    node.style.opacity = '1'
  }, [])
  const scene = useScrollProgress<HTMLElement>(onProgress)

  return (
    <section className="noir hero-pin" ref={scene}>
      <div className="hero-full hero-stick">
        <div aria-hidden="true" className="hero-art" data-thread="start">
          <svg className="hdraw" viewBox="40 140 1200 960" role="presentation" focusable="false">
            <defs>
              <mask id={MASK_ID} maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254">
                <g fill="none" stroke="#fff" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round">
                  {PROFILE_DRAW.map((seg, i) => (
                    <path key={seg.d} className="stroke" pathLength={1} d={seg.d} style={{ '--s': seg.s, '--e': seg.e } as React.CSSProperties} ref={(el) => { lines.current[i] = el }} />
                  ))}
                </g>
              </mask>
            </defs>
            <path className="guide" d={PROFILE_FILL} fillRule="evenodd" />
            <path className="profile" d={PROFILE_FILL} fillRule="evenodd" mask={`url(#${MASK_ID})`} />
            <g className="tools" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: TOOLS_SVG }} />
            <g className="pen" ref={pen}>
              <circle r="26" className="pen__glow" />
              <circle r="8" className="pen__dot" />
            </g>
          </svg>
        </div>
        {children}
      </div>
    </section>
  )
}
