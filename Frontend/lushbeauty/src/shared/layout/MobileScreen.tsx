import type { ReactNode } from 'react'
import { useConnection } from '../connection'
import { useEnter } from '../motion'
import { StatusBar, Tabs, TopBar } from '../ui'
import { ROUTES } from './navigation'
import type { TabItem } from '../ui'

interface MobileScreenProps {
  /** Con `title` y `backTo` se muestra la barra superior con «Volver». */
  title?: string
  backTo?: string
  /** Contenido que va antes de la barra de estado (p. ej. cabecera de marca). */
  header?: ReactNode
  tabs?: TabItem[]
  footer?: ReactNode
  /** Quita el borde superior del pie cuando le siguen pestañas. */
  footerBorderless?: boolean
  children: ReactNode
}

/** Pantalla móvil: barra, estado de conexión, contenido, pie y pestañas. */
export function MobileScreen({
  title,
  backTo,
  header,
  tabs,
  footer,
  footerBorderless,
  children,
}: MobileScreenProps) {
  const { online, pending } = useConnection()
  const main = useEnter<HTMLElement>()
  return (
    <div className="lx mscreen">
      {header ?? (title && backTo ? <TopBar title={title} backTo={backTo} /> : null)}
      <StatusBar online={online} pending={pending} to={ROUTES.sync} />
      <main className="main" ref={main}>
        {children}
      </main>
      {footer ? (
        <div className="foot" style={footerBorderless ? { borderTop: 0 } : undefined}>
          {footer}
        </div>
      ) : null}
      {tabs ? <Tabs items={tabs} /> : null}
    </div>
  )
}
