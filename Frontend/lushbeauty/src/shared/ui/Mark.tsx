import { useId, type CSSProperties } from 'react'
import { MARK_DRAW_RANGES } from './markDraw'

/**
 * Monograma LB: letras Jost; el pie de la L pasa por delante de la B y la corta con un filete de aire.
 * Trazo fino desde 40 px de alto; por debajo, corte más ancho (Jost Regular).
 */
const MONO = {
  fine: {
    w: 702,
    h: 700,
    defs: '<mask id="lbm-f" maskUnits="userSpaceOnUse" x="-100" y="-100" width="902" height="900"><rect x="-100" y="-100" width="902" height="900" fill="#fff"/><path d="M84 700V0H428V52H139V700Z" transform="translate(-84 700) scale(1 -1)" fill="#000" stroke="#000" stroke-width="30" stroke-linejoin="miter"/></mask>',
    body: '<g mask="url(#lbm-f)"><path d="M127 376H240Q299 376 344.0 393.5Q389 411 414.5 445.5Q440 480 440 531Q440 587 415.0 624.5Q390 662 344.5 681.0Q299 700 236 700H84V0H246Q314 0 366.5 22.0Q419 44 449.0 89.0Q479 134 479 203Q479 251 459.5 286.5Q440 322 407.5 345.0Q375 368 334.0 379.5Q293 391 250 391H127V359H246Q282 359 313.5 349.0Q345 339 370.0 319.5Q395 300 409.0 271.5Q423 243 423 206Q423 154 401.0 119.5Q379 85 339.0 67.0Q299 49 246 49H139V651H236Q304 651 344.5 618.5Q385 586 385 528Q385 487 365.0 460.5Q345 434 311.0 421.0Q277 408 236 408H127Z" transform="translate(223 700) scale(1 -1)"/></g><path d="M84 700V0H428V52H139V700Z" transform="translate(-84 700) scale(1 -1)"/>',
  },
  small: {
    w: 728,
    h: 700,
    defs: '<mask id="lbm-s" maskUnits="userSpaceOnUse" x="-100" y="-100" width="928" height="900"><rect x="-100" y="-100" width="928" height="900" fill="#fff"/><path d="M80 700V0H440V80H165V700Z" transform="translate(-80 700) scale(1 -1)" fill="#000" stroke="#000" stroke-width="44" stroke-linejoin="miter"/></mask>',
    body: '<g mask="url(#lbm-s)"><path d="M147 370H260Q323 370 369.5 388.0Q416 406 442.0 441.0Q468 476 468 525Q468 585 442.0 623.5Q416 662 369.5 681.0Q323 700 260 700H80V0H270Q338 0 391.5 22.5Q445 45 476.5 90.5Q508 136 508 205Q508 253 490.0 288.0Q472 323 439.5 345.5Q407 368 364.0 379.0Q321 390 270 390H147V343H270Q304 343 332.0 334.5Q360 326 380.5 309.0Q401 292 412.0 267.0Q423 242 423 210Q423 167 403.5 137.0Q384 107 349.5 91.0Q315 75 270 75H165V625H260Q313 625 348.0 597.5Q383 570 383 520Q383 487 367.0 464.0Q351 441 323.0 429.0Q295 417 260 417H147Z" transform="translate(220 700) scale(1 -1)"/></g><path d="M80 700V0H440V80H165V700Z" transform="translate(-80 700) scale(1 -1)"/>',
  },
} as const

export function Mark({ height = 56 }: { height?: number }) {
  const m = height < 40 ? MONO.small : MONO.fine
  // Cada monograma usa su propio id de máscara: dos en la misma página no deben compartirlo.
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const defs = m.defs.replace(/id="(lbm-[fs])"/, `id="$1-${uid}"`)
  const body = m.body.replace(/url\(#(lbm-[fs])\)/, `url(#$1-${uid})`)
  return (
    <svg
      className="lb-mark"
      viewBox={`0 0 ${m.w} ${m.h}`}
      height={height}
      width={(height * m.w) / m.h}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <defs dangerouslySetInnerHTML={{ __html: defs }} />
      <g dangerouslySetInnerHTML={{ __html: body }} />
    </svg>
  )
}

const L_D = 'M84 700V0H428V52H139V700Z'
const L_T = 'translate(-84 700) scale(1 -1)'
const B_D = /d="(M127 376H[^"]+)"/.exec(MONO.fine.body)?.[1] ?? ''
const B_T = 'translate(223 700) scale(1 -1)'

interface MarkDrawProps {
  /** Alto en px. */
  height: number
}

/**
 * Monograma LB que se dibuja y se rellena según `--p` (0–1) heredado de un ancestro: primero el
 * contorno de la L, luego el de la B (el pie de la L sigue pasando por delante), y al final el
 * relleno sube de abajo hacia arriba. Con `--p: 1` es el monograma completo.
 */
export function MarkDraw({ height }: MarkDrawProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const m = MONO.fine
  const cut = `lbd-cut-${uid}`
  const rise = `lbd-rise-${uid}`
  const range = (r: readonly [number, number]) => ({ '--s': r[0], '--e': r[1] }) as CSSProperties
  return (
    <svg className="lb-mark lb-draw" viewBox={`0 0 ${m.w} ${m.h}`} height={height} width={(height * m.w) / m.h} aria-hidden="true" focusable="false" style={{ overflow: 'visible' }}>
      <defs>
        <mask id={cut} maskUnits="userSpaceOnUse" x="-100" y="-100" width="902" height="900">
          <rect x="-100" y="-100" width="902" height="900" fill="#fff" />
          <path d={L_D} transform={L_T} fill="#000" stroke="#000" strokeWidth="30" strokeLinejoin="miter" />
        </mask>
        <mask id={rise} maskUnits="userSpaceOnUse" x="-100" y="-100" width="902" height="900">
          <rect className="lb-draw__rise" x="-100" y="-100" width="902" height="900" fill="#fff" style={range(MARK_DRAW_RANGES.fill)} />
        </mask>
      </defs>
      <g mask={`url(#${rise})`} fill="currentColor">
        <g mask={`url(#${cut})`}><path d={B_D} transform={B_T} /></g>
        <path d={L_D} transform={L_T} />
      </g>
      <g className="lb-draw__lines" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path className="lb-draw__line" pathLength={1} d={L_D} transform={L_T} style={range(MARK_DRAW_RANGES.l)} />
        <g mask={`url(#${cut})`}>
          <path className="lb-draw__line" pathLength={1} d={B_D} transform={B_T} style={range(MARK_DRAW_RANGES.b)} />
        </g>
      </g>
    </svg>
  )
}
