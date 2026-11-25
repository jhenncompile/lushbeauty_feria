import { cx } from './cx'

/** Láminas de línea fina de la casa (vectoriales, en /art). Decorativas: siempre ocultas a lectores de pantalla. */
export const ART = { contour: '/art/contour.svg', orbit: '/art/orbit.svg' } as const

interface BackdropProps {
  /** Opacidad de la lámina; el diseño usa .28–.55 según el contraste que necesite el texto encima. */
  opacity?: number
  className?: string
}

/** Lámina de contornos a sangre en un contenedor `.rel` (el contenido va en `.above`). */
export function Backdrop({ opacity, className }: BackdropProps) {
  return (
    <img
      className={cx('fill-img', opacity === undefined && 'dim', className)}
      src={ART.contour}
      alt=""
      aria-hidden="true"
      style={opacity === undefined ? undefined : { opacity }}
    />
  )
}

interface OrbitProps {
  opacity?: number
  /** Estilos de posición del contenedor (el diseño la ubica distinto en cada pantalla). */
  style?: React.CSSProperties
}

/** Lámina circular que gira muy despacio; se coloca por detrás del contenido. */
export function Orbit({ opacity = 0.55, style }: OrbitProps) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', zIndex: -1, opacity, ...style }}>
      <img className="spin" src={ART.orbit} alt="" style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
