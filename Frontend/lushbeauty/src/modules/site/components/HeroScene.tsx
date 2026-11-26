import type { ReactNode } from 'react'
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
  const scene = useScrollProgress<HTMLElement>(undefined, 'pin', 0.16)

  return (
    <section className="noir hero-pin" ref={scene}>
      <div className="hero-full hero-stick">
        <div aria-hidden="true" className="hero-art" data-thread="start">
          <svg className="hdraw" viewBox="40 140 1200 960" role="presentation" focusable="false">
            <defs>
              <mask id={MASK_ID} maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254">
                <g fill="none" stroke="#fff" strokeWidth="34" strokeLinecap="round" strokeLinejoin="round">
                  {PROFILE_DRAW.map((seg) => (
                    <path key={seg.d} className="stroke" pathLength={1} d={seg.d} style={{ '--s': seg.s, '--e': seg.e } as React.CSSProperties} />
                  ))}
                </g>
              </mask>
            </defs>
            <path className="guide" d={PROFILE_FILL} fillRule="evenodd" />
            <path className="profile" d={PROFILE_FILL} fillRule="evenodd" mask={`url(#${MASK_ID})`} />
            <g className="tools" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: TOOLS_SVG }} />
          </svg>
        </div>
        {children}
      </div>
    </section>
  )
}
