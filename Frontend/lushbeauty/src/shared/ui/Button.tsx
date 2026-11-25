import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cx } from './cx'

type Variant = 'primary' | 'secondary' | 'danger' | 'link'

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: Variant
  block?: boolean
  className?: string
  children: ReactNode
  /** Si se indica, se renderiza un enlace con aspecto de botón. */
  to?: string
}

export function Button({ variant = 'primary', block, className, children, to, ...rest }: ButtonProps) {
  const classes = cx('lb-btn', `lb-btn--${variant}`, block && 'btn-block', className)
  if (to !== undefined) {
    return (
      <Link className={classes} to={to}>
        {children}
      </Link>
    )
  }
  return (
    <button type="button" {...rest} className={classes}>
      {children}
    </button>
  )
}
