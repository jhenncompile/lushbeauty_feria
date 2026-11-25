import { Link } from 'react-router-dom'
import { ROUTES } from '../../../shared/layout'
import { SUGGESTED } from '../domain/answer'

export function Suggested({ web }: { web?: boolean }) {
  return (
    <section>
      <p className="eyebrow">Preguntas disponibles</p>
      <ul style={{ marginTop: 'var(--space-2)', ...(web ? { borderTop: '1px solid var(--ink)' } : {}) }}>
        {SUGGESTED.map((label, index) => (
          <li key={label}>
            <Link className="line line--link" to={index === SUGGESTED.length - 1 ? (web ? ROUTES.webGuard : ROUTES.guard) : web ? ROUTES.webInsight : ROUTES.insight}>
              <span className="line__label">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
