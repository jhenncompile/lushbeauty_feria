import { NavLink } from 'react-router-dom'
import { cx } from './cx'

export interface TabItem {
  label: string
  to: string
}

export function Tabs({ items }: { items: TabItem[] }) {
  return (
    <nav className={cx('tabs', items.length === 2 && 'tabs--2')} aria-label="Principal">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => cx('tab', isActive && 'is-current')}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
