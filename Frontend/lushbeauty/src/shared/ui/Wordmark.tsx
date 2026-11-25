import { cx } from './cx'

interface WordmarkProps {
  variant?: 'horizontal' | 'stacked'
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
  return (
    <span className={cx('lb-wm', `lb-wm--${tone}`, `lb-wm--${variant}`, className)}>
      <span className="lb-wm__name" style={{ fontSize: size }}>
        LUSH BEAUTY
      </span>
      {descriptor ? <span className="lb-wm__desc">{descriptor}</span> : null}
    </span>
  )
}
