import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useConnection } from '../connection'
import { useEnter } from '../motion'
import { StatusBar, Wordmark, cx } from '../ui'
import { ROUTES, WEB_LINKS } from './navigation'

interface WebScreenProps {
  children: ReactNode
}

/** Pantalla web: navegación superior, estado de conexión y contenido centrado. */
export function WebScreen({ children }: WebScreenProps) {
  const { online, pending } = useConnection()
  const main = useEnter<HTMLElement>()
  const link = ({ isActive }: { isActive: boolean }) => cx('lb-nav__link', isActive && 'is-current')
  return (
    <div className="lx web">
      <header className="lb-nav">
        <nav className="lb-nav__links" aria-label="Principal">
          {WEB_LINKS.map((item) => (
            <NavLink key={item.to} to={item.to} className={link}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <Link className="lb-nav__brand" to={ROUTES.webPanel} aria-label="Lush Beauty, inicio">
          <Wordmark size={20} />
        </Link>
        <div className="lb-nav__actions">
          <Link className="lb-nav__link" to={ROUTES.webSettings}>
            Ajustes
          </Link>
          <Link className="lb-nav__link" to={ROUTES.login}>
            Salir
          </Link>
        </div>
      </header>
      <nav className="mnav" aria-label="Principal móvil">
        {WEB_LINKS.map((item) => (
          <NavLink key={item.to} to={item.to}>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <StatusBar online={online} pending={pending} />
      <main className="wrap stack--lg stack" ref={main} style={{ paddingBlock: 'var(--space-7) var(--space-9)' }}>
        {children}
      </main>
    </div>
  )
}
