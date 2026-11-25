import { formatBs } from '../../../shared/money'
import { ROUTES, WebScreen } from '../../../shared/layout'
import { Button, Panel, ServiceRow, Tag } from '../../../shared/ui'
import { COMBOS, ILLUSTRATIVE_POLICY, SERVICES } from '../fixtures'

function percent(bps: number): string {
  return `${bps / 100}`.replace('.', ',') + ' %'
}

export function WebCatalogoPage() {
  const policy = ILLUSTRATIVE_POLICY
  return (
    <WebScreen>
      <div className="stack" style={{ gap: 'var(--space-2)' }}>
        <Button variant="link" to={ROUTES.webPanel} style={{ alignSelf: 'flex-start' }}>
          Volver al panel
        </Button>
        <p className="eyebrow">Configuración del salón</p>
        <h1 className="display-lg">Catálogo y reglas</h1>
      </div>
      <div className="cols cols--21">
        <section aria-label="Servicios">
          <div style={{ borderTop: '1px solid var(--ink)' }}>
            {SERVICES.map((service, index) => (
              <ServiceRow
                key={service.id}
                index={String(index + 1).padStart(2, '0')}
                title={service.name}
                description={service.description}
                duration={`${service.durationMin} min`}
                price={formatBs(service.listPriceCents, { decimals: 0 })}
              />
            ))}
          </div>
          <p className="t-caption" style={{ marginTop: 'var(--space-3)' }}>
            Precios y duraciones ilustrativos. Cambiar un precio no recalcula ventas pasadas. La edición del catálogo
            llega con el servidor.
          </p>
        </section>
        <aside className="stack--lg stack">
          <Panel>
            <p className="eyebrow">Comisión vigente</p>
            <p className="t-headline">
              {percent(policy.commissionBps)} sobre {policy.commissionBase}
            </p>
            <p className="t-body muted">
              Se aplica el porcentaje vigente en el momento de registrar la venta. Cada cambio guarda su motivo. Valor
              ilustrativo: la base de comisión está por definir con la administradora.
            </p>
          </Panel>
          <Panel>
            <p className="eyebrow">Descuento máximo autorizado</p>
            <p className="t-headline">{percent(policy.maxDiscountBps)}</p>
            <p className="t-body muted">
              Por encima de ese valor, el descuento requiere la aprobación de la administradora. Valor ilustrativo.
            </p>
          </Panel>
          <div>
            <p className="eyebrow">Combos</p>
            <div style={{ marginTop: 'var(--space-2)' }}>
              {COMBOS.map((combo, index) => (
                <div className={index === 0 ? 'line line--top' : 'line'} key={combo.id}>
                  <div>
                    <p className="t-body">{combo.name}</p>
                    <p className="t-caption">Se descompone en {combo.lines === 3 ? 'tres' : combo.lines} líneas</p>
                  </div>
                  <Tag tone="ok">Activo</Tag>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </WebScreen>
  )
}
