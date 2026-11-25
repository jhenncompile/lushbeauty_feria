import { useState } from 'react'
import { Button, Tag } from '../../../shared/ui'
import { AUTOMATIONS } from '../fixtures'

/** Avisos automáticos (n8n): nunca reemplazan el registro contable; los fallos se reintentan un número limitado de veces. */
export function AutomationsSection() {
  const [retried, setRetried] = useState(false)
  return (
    <section className="stack--lg stack" aria-label="Avisos con n8n">
      <div className="stack" style={{ gap: 'var(--space-2)' }}>
        <p className="eyebrow">Automatizaciones</p>
        <h2 className="t-headline">Avisos con n8n</h2>
        <p className="t-body muted measure">
          Los avisos nunca reemplazan el registro contable. Cada evento enviado queda registrado y los fallos se
          reintentan un número limitado de veces.
        </p>
      </div>
      <div>
        {AUTOMATIONS.map((item, index) => (
          <div className={index === 0 ? 'line line--top' : 'line'} key={item.id}>
            <div>
              <p className="t-body">{item.name}</p>
              <p className="t-caption">{item.detail}</p>
            </div>
            <Tag tone={item.state === 'Activo' ? 'ok' : 'rouge'}>{item.state}</Tag>
          </div>
        ))}
      </div>
      <p className="t-caption" role="status">
        {retried
          ? 'Reintento registrado (simulado: aún no hay servidor ni n8n). Katherine sigue sin correo: agréguelo para que el aviso pueda enviarse.'
          : 'Error: no se pudo enviar el aviso a Katherine porque no tiene correo registrado. Agregue el correo y reintente.'}
      </p>
      <div className="row">
        <Button variant="secondary" onClick={() => setRetried(true)}>Reintentar aviso a Katherine</Button>
      </div>
    </section>
  )
}
