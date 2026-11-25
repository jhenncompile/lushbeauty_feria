import { Tag } from '../../../shared/ui'
import { ASSUMPTIONS } from '../fixtures'

export function AssumptionList() {
  return (
    <ul>
      {ASSUMPTIONS.map((item, index) => (
        <li className="line" style={{ padding: 'var(--space-3) 0', ...(index === 0 ? { borderTop: '1px solid var(--ink)' } : {}) }} key={item.text}>
          <span className="t-body">{item.text.replace(' %', ' %')}</span>
          <Tag tone={item.kind === 'Dato' ? 'ok' : undefined}>{item.kind}</Tag>
        </li>
      ))}
    </ul>
  )
}
