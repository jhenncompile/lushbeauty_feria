import { Link } from 'react-router-dom'
import { ROUTES, WebScreen } from '../../../shared/layout'
import { Button } from '../../../shared/ui'
import { AutomationsSection } from '../../notifications'
import { PERMISSION_COLUMNS, USERS } from '../permissions'

export function WebAjustesPage() {
  return (
    <WebScreen>
      <div className="stack" style={{ gap: 'var(--space-9)' }}>
        <div className="stack" style={{ gap: 'var(--space-2)' }}>
          <p className="eyebrow">Salón Lush Beauty</p>
          <h1 className="display-lg">Ajustes</h1>
        </div>

        <section className="stack--lg stack" aria-label="Usuarias y roles">
          <div className="row row--between">
            <div className="stack" style={{ gap: 'var(--space-2)' }}>
              <p className="eyebrow">Usuarias y roles</p>
              <h2 className="t-headline">Quién puede qué</h2>
            </div>
            <Button variant="secondary">Invitar usuaria</Button>
          </div>
          <div className="scroll">
            <table className="tbl tbl--web">
              <thead>
                <tr>
                  <th className="l" scope="col">Usuaria</th>
                  <th className="l" scope="col">Rol</th>
                  {PERMISSION_COLUMNS.map((column) => (
                    <th key={column} scope="col">{column}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {USERS.map((user) => (
                  <tr key={user.name}>
                    <td className={user.disabled ? 'muted' : undefined}>{user.name}</td>
                    <td className={user.disabled ? 'l muted' : 'l'}>{user.role}</td>
                    {user.permissions.map((value, index) => (
                      <td key={PERMISSION_COLUMNS[index]}>{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <AutomationsSection />

        <section className="stack--lg stack" aria-label="Seguridad y datos">
          <div className="stack" style={{ gap: 'var(--space-2)' }}>
            <p className="eyebrow">Seguridad y datos</p>
            <h2 className="t-headline">Su salón, en su propio espacio</h2>
          </div>
          <div className="grid grid--3">
            <div className="stack" style={{ borderTop: '1px solid var(--ink)', paddingTop: 'var(--space-4)' }}>
              <p className="t-label">Aislamiento por salón</p>
              <p className="t-body muted">Los datos de cada salón se mantienen separados y no se mezclan.</p>
            </div>
            <div className="stack" style={{ borderTop: '1px solid var(--ink)', paddingTop: 'var(--space-4)' }}>
              <p className="t-label">Historial inalterable</p>
              <p className="t-body muted">Cada cambio guarda quién lo hizo, cuándo y el valor anterior.</p>
              <Link className="lb-btn lb-btn--link" style={{ alignSelf: 'flex-start' }} to={ROUTES.webAudit}>Ver auditoría</Link>
            </div>
            <div className="stack" style={{ borderTop: '1px solid var(--ink)', paddingTop: 'var(--space-4)' }}>
              <p className="t-label">Exportar sus datos</p>
              <p className="t-body muted">Descargue ventas y liquidaciones en Excel cuando lo necesite.</p>
              <Button variant="secondary" style={{ alignSelf: 'flex-start' }}>Exportar a Excel</Button>
            </div>
          </div>
        </section>
      </div>
    </WebScreen>
  )
}
