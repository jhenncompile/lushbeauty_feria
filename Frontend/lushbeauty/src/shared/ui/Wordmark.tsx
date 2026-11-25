import { Mark } from './Mark'
import { cx } from './cx'

interface WordmarkProps {
  /** `mark` es solo el monograma; `stacked` lo pone sobre el nombre. */
  variant?: 'horizontal' | 'stacked' | 'mark'
  tone?: 'ink' | 'inverse'
  size?: number
  descriptor?: string
  className?: string
}

export function Wordmark({
  variant = 'horizontal',
  tone = 'ink',
  size = 20,
  descriptor,
  className,
}: WordmarkProps) {
  const classes = cx('lb-wm', `lb-wm--${tone}`, `lb-wm--${variant}`, className)
  const name = (
    <span className="lb-wm__name" style={{ fontSize: size }}>
      LUSH BEAUTY
    </span>
  )
  const desc = descriptor ? <span className="lb-wm__desc">{descriptor}</span> : null
  if (variant === 'mark') {
    return (
      <span className={classes} role="img" aria-label="Lush Beauty">
        <Mark height={size} />
      </span>
    )
  }
  if (variant === 'stacked') {
    return (
      <span className={classes} role="img" aria-label="Lush Beauty">
        <Mark height={Math.round(size * 3.2)} />
        {name}
        {desc}
      </span>
    )
  }
  return (
    <span className={classes}>
      {name}
      {desc}
    </span>
  )
}
