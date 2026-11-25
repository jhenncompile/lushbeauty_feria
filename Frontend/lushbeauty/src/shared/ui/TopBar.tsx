import { Link } from 'react-router-dom'

interface TopBarProps {
  title: string
  backTo: string
}

export function TopBar({ title, backTo }: TopBarProps) {
  return (
    <header className="bar">
      <Link className="bar__link" to={backTo}>
        Volver
      </Link>
      <span className="eyebrow bar__title">{title}</span>
      <span />
    </header>
  )
}
