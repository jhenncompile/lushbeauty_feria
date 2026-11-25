import type { ReactNode } from 'react'
import { cx } from './cx'

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('panel', className)}>{children}</div>
}
