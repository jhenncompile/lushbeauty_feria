import { formatBs } from '../money'
import { useCountUp } from './hooks'

interface CountBsProps {
  cents: number
  decimals?: 0 | 2
}

/** Importe que «cuenta» hasta su valor exacto al aparecer. El texto accesible es siempre el valor final. */
export function CountBs({ cents, decimals = 0 }: CountBsProps) {
  const shown = useCountUp(cents)
  if (shown === cents) return <>{formatBs(cents, { decimals })}</>
  return (
    <>
      <span aria-hidden="true">{formatBs(shown, { decimals })}</span>
      <span className="sr-only">{formatBs(cents, { decimals })}</span>
    </>
  )
}
