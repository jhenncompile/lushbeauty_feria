import { useState } from 'react'
import { ROUTES, WebScreen } from '../../../shared/layout'
import { Button, Tag } from '../../../shared/ui'
import { useAlerts } from '../components/useAlerts'
import { RULES } from '../fixtures'

type Filter = 'pending' | 'reviewed' | 'all'

export function WebGuardPage() {
  const { alerts, pending, reviewed, review } = useAlerts()
  const [filter, setFilter] = useState<Filter>('pending')
  const shown = alerts.filter((alert) => filter === 'all' || alert.status === filter)
  const tabs: { id: Filter; label: string }[] = [
    { id: 'pending', label: `Por revisar · ${pending}` },
    { id: 'reviewed', label: `Revisadas · ${reviewed}` },
    { id: 'all', label: 'Todas' },
  ]
  return (
    <WebScreen>
      <div className="stack" style={{ gap: 'var(--space-2)' }}>
        <Button variant="link" to={ROUTES.webPanel} style={{ alignSelf: 'flex-start' }}>Volver al panel</Button>
        <p className="eyebrow">Alertas y control de calidad</p>
        <h1 className="display-lg">Lush Guard</h1>
        <p className="t-body muted measure">
          Las alertas siguen reglas configuradas. Una alerta no indica una conducta indebida: pide una revisión.
        </p>
      </div>
      <div className="subtabs" role="group" aria-label="Estado">
        {tabs.map((tab) => (
          <a
            key={tab.id}
            href="#alertas"
            className={filter === tab.id ? 'is-current' : undefined}
            aria-current={filter === tab.id ? 'true' : undefined}
            onClick={(event) => {
              event.preventDefault()
              setFilter(tab.id)
            }}
          >
            {tab.label}
          </a>
        ))}
      </div>
      <div className="scroll" id="alertas">
        <table className="tbl tbl--web">
          <thead>
            <tr>
              <th className="l" scope="col">Regla</th>
              <th className="l" scope="col">Dato observado</th>
              <th scope="col">Umbral</th>
              <th className="l" scope="col">Origen</th>
              <th className="l" scope="col">Estado</th>
              <th className="l" scope="col">Acción</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 ? (
              <tr><td colSpan={6} className="l">No hay alertas en este estado.</td></tr>
            ) : (
              shown.map((alert) => (
                <tr key={alert.id}>
                  <td>{alert.rule}</td>
                  <td className="l">{alert.observed.replace(' %', ' %')}</td>
                  <td>{alert.threshold.replace(' %', ' %')}</td>
                  <td className="l">{alert.origin}</td>
                  <td className="l"><Tag tone={alert.status === 'pending' ? 'rouge' : 'ok'}>{alert.status === 'pending' ? 'Por revisar' : 'Revisada'}</Tag></td>
                  <td className="l">
                    {alert.status === 'pending' ? (
                      <Button variant="secondary" className="btn-compact" onClick={() => review(alert.id)}>Marcar revisada</Button>
                    ) : (
                      <span className="t-caption">Revisada por {alert.reviewedBy}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p className="t-caption" style={{ marginTop: 'var(--space-3)' }}>Cifras ilustrativas.</p>
      </div>
      <div className="cols cols--12">
        <div className="stack">
          <p className="eyebrow">Reglas activas</p>
          <h2 className="t-headline">Qué vigila Lush Guard</h2>
          <p className="t-body muted">Cada regla indica el dato que observa y el umbral que usted define.</p>
        </div>
        <div>
          {RULES.map((rule, index) => (
            <div className={index === 0 ? 'line line--top' : 'line'} key={rule.name}>
              <div>
                <p className="t-body">{rule.name}</p>
                <p className="t-caption">{rule.description}</p>
              </div>
              {rule.value ? (
                <span className="line__value--md">{rule.value.replace(' %', ' %')}</span>
              ) : (
                <Tag tone={rule.experimental ? undefined : 'ok'}>{rule.experimental ? 'Experimental' : 'Activa'}</Tag>
              )}
            </div>
          ))}
        </div>
      </div>
    </WebScreen>
  )
}
