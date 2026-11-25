import type { ReactNode } from 'react'
import { cx } from './cx'

export function Tag({ tone, children }: { tone?: 'ok' | 'rouge'; children: ReactNode }) {
  return <span className={cx('tag', tone && `tag--${tone}`)}>{children}</span>
}
