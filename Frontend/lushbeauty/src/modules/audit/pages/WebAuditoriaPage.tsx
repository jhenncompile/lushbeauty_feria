import { useId, useState } from 'react'
import { ROUTES, WebScreen } from '../../../shared/layout'
import { Button } from '../../../shared/ui'
import { ENTRIES } from '../fixtures'

const unique = (values: string[]) => Array.from(new Set(values))

export function WebAuditoriaPage() {
  const [user, setUser] = useState('Todas')
  const [action, setAction] = useState('Todas')
  const ids = { user: useId(), action: useId(), period: useId() }
  const rows = ENTRIES.filter(
    (entry) => (user === 'Todas' || entry.user === user) && (action === 'Todas' || entry.action === action),
  )
  return (
    <WebScreen>
      <div className="stack" style={{ gap: 'var(--space-2)' }}>
        <Button variant="link" to={ROUTES.webPanel} style={{ alignSelf: 'flex-start' }}>Volver al panel</Button>
        <p className="eyebrow">Historial de cambios</p>
        <h1 className="display-lg">Auditoría</h1>
        <p className="t-body muted measure">
          Cada acción guarda quién la hizo, cuándo y el valor anterior. Este historial no se puede editar ni borrar.
        </p>
      </div>
      <div className="toolbar">
        <div>
          <label className="eyebrow" htmlFor={ids.user}>Usuaria</label>
          <select className="sel" id={ids.user} value={user} onChange={(event) => setUser(event.target.value)}>
            {['Todas', ...unique(ENTRIES.map((e) => e.user))].map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div>
          <label className="eyebrow" htmlFor={ids.action}>Acción</label>
          <select className="sel" id={ids.action} value={action} onChange={(event) => setAction(event.target.value)}>
            {['Todas', ...unique(ENTRIES.map((e) => e.action))].map((value) => <option key={value}>{value}</option>)}
          </select>
        </div>
        <div>
          <label className="eyebrow" htmlFor={ids.period}>Período</label>
          <select className="sel" id={ids.period}><option>Últimos 7 días</option></select>
        </div>
      </div>
      <div className="scroll">
        <table className="tbl tbl--web">
          <thead>
            <tr>
              <th className="l" scope="col">Fecha y hora</th>
              <th className="l" scope="col">Usuaria</th>
              <th className="l" scope="col">Acción</th>
              <th className="l" scope="col">Registro</th>
              <th className="l" scope="col">Antes</th>
              <th className="l" scope="col">Después</th>
              <th className="l" scope="col">Motivo</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="l">No hay registros con esos filtros.</td></tr>
            ) : (
              rows.map((entry) => (
                <tr key={entry.at + entry.action}>
                  <td>{entry.at}</td>
                  <td className="l">{entry.user}</td>
                  <td className="l">{entry.action}</td>
                  <td className="l">{entry.record}</td>
                  <td className="l">{entry.before}</td>
                  <td className="l">{entry.after.replace(' %', ' %')}</td>
                  <td className="l">{entry.reason}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p className="t-caption" style={{ marginTop: 'var(--space-3)' }}>Registros ilustrativos.</p>
      </div>
    </WebScreen>
  )
}
