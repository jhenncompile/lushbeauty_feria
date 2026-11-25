import { cx } from './cx'

interface StatProps {
  label: string
  value: string
  delta?: string
  note?: string
  tone?: 'up' | 'down' | 'neutral'
  className?: string
}

export function Stat({ label, value, delta, note, tone = 'neutral', className }: StatProps) {
  return (
    <div className={cx('lb-stat', className)}>
      <div className="lb-stat__label">{label}</div>
      <div className="lb-stat__value">{value}</div>
      {delta ? <div className={cx('lb-stat__delta', `lb-stat__delta--${tone}`)}>{delta}</div> : null}
      {note ? <div className="lb-stat__note">{note}</div> : null}
    </div>
  )
}
