import { Link } from 'react-router-dom'

interface StatusBarProps {
  online: boolean
  pending?: number
  /** Si se indica, el estado enlaza a la cola de envío. */
  to?: string
}

export function StatusBar({ online, pending = 0, to }: StatusBarProps) {
  const text = online ? 'En línea · todo sincronizado' : `Sin conexión · ${pending} pendientes`
  const content = to ? (
    <Link to={to} style={{ color: 'inherit' }}>
      {text}
    </Link>
  ) : (
    <span>{text}</span>
  )
  return (
    <div className={online ? 'status' : 'status status--off'} role="status">
      <span className={online ? 'dot dot--ok' : 'dot dot--ink'} aria-hidden="true" />
      {content}
    </div>
  )
}
