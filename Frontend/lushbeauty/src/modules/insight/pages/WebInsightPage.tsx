import { ROUTES, WebScreen } from '../../../shared/layout'
import { Button, Panel } from '../../../shared/ui'
import { Conversation } from '../components/Conversation'
import { Suggested } from '../components/Suggested'

export function WebInsightPage() {
  return (
    <WebScreen>
      <div className="stack" style={{ gap: 'var(--space-2)' }}>
        <Button variant="link" to={ROUTES.webPanel} style={{ alignSelf: 'flex-start' }}>Volver al panel</Button>
        <p className="eyebrow">Asistente financiero</p>
        <h1 className="display-lg">Lush Insight</h1>
        <p className="t-body muted measure">Responde con cifras de sus reportes. No modifica registros ni autoriza pagos.</p>
      </div>
      <div className="cols cols--21">
        <section className="stack--lg stack">
          <Conversation web />
        </section>
        <aside className="stack--lg stack">
          <Suggested web />
          <Panel>
            <p className="eyebrow">Cómo responde</p>
            <p className="t-body">
              Cada cifra viene de un reporte que puede abrir. Si no hay datos, lo dice. No muestra la nómina de otras
              especialistas a quien no corresponde.
            </p>
          </Panel>
        </aside>
      </div>
    </WebScreen>
  )
}
