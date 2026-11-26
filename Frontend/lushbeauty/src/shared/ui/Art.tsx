import { cx } from './cx'

import { ART } from './artPaths'

interface BackdropProps {
  /** Opacidad de la lámina; el diseño usa .28–.55 según el contraste que necesite el texto encima. */
  opacity?: number
  className?: string
}

/** Patrón de artículos del salón a sangre en un contenedor `.rel` (el contenido va en `.above`). */
export function Backdrop({ opacity, className }: BackdropProps) {
  return (
    <img
      className={cx('fill-img', opacity === undefined && 'dim', className)}
      src={ART.pattern}
      alt=""
      aria-hidden="true"
      style={opacity === undefined ? undefined : { opacity }}
    />
  )
}

interface ProfileProps {
  /** Lámina a mostrar; por defecto el perfil solo. */
  src?: string
  /** Clase para reubicarla por ancho de pantalla desde el CSS. */
  className?: string
  opacity?: number
  /** Estilos de posición del contenedor (el diseño la ubica distinto en cada pantalla). */
  style?: React.CSSProperties
}

/** Perfil femenino a un solo trazo que se dibuja al cargar; se coloca por detrás del contenido. */
export function Profile({ src = ART.profile, className, opacity = 0.55, style }: ProfileProps) {
  return (
    <div aria-hidden="true" className={className} style={{ position: 'absolute', zIndex: -1, opacity, ...style }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%' }} />
    </div>
  )
}
