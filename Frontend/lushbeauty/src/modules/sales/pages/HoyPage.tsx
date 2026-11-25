import { formatBs } from '../../../shared/money'
import { ADMIN_TABS, MobileScreen, ROUTES } from '../../../shared/layout'
import { Link } from 'react-router-dom'
import { useConnection } from '../../../shared/connection'
import { CountBs } from '../../../shared/motion'
import { Backdrop, Button, Tag, Wordmark } from '../../../shared/ui'
import { TODAY } from '../fixtures'

export function HoyPage() {
  const { pending } = useConnection()
  const total = TODAY.byMethod.reduce((sum, item) => sum + item.cents, 0)
  return (
    <MobileScreen
      header={
        <header className="lb-nav">
          <span />
          <Link className="lb-nav__brand" to={ROUTES.home} aria-label="Lush Beauty, inicio">
            <Wordmark size={20} />
          </Link>
          <div className="lb-nav__actions">
            <Link className="lb-nav__link" to={ROUTES.webSettings}>
              Cuenta
            </Link>
          </div>
        </header>
      }
      tabs={ADMIN_TABS}
      footer={
        <Button block to={ROUTES.register}>
          Registrar servicio
        </Button>
      }
      footerBorderless
    >
      <section className="noir rel hoy__hero">
        <Backdrop opacity={0.4} />
        <div className="above stack">
          <p className="eyebrow">{TODAY.label} · Hoy</p>
          <p className="hoy__total">
            <CountBs cents={total} />
          </p>
          <p className="t-body">Cobrado hoy · {TODAY.servicesCount} servicios registrados</p>
          <p className="t-caption">Ilustrativo</p>
        </div>
      </section>
      <div>
        {TODAY.byMethod.map((item) => (
          <div className="line" key={item.method}>
            <span className="line__label">{item.method}</span>
            <span className="line__value">{formatBs(item.cents, { decimals: 0 })}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="eyebrow">Atajos</p>
        <Link className="line line--link" style={{ marginTop: 'var(--space-2)' }} to={ROUTES.insight}>
          <span className="line__label">Preguntar a Lush Insight</span>
        </Link>
        <Link className="line line--link" to={ROUTES.guard}>
          <span className="line__label">Lush Guard</span>
          <Tag tone="rouge">2 por revisar</Tag>
        </Link>
        <Link className="line line--link" to={ROUTES.import}>
          <span className="line__label">Importar planilla</span>
        </Link>
        <Link className="line line--link" to={ROUTES.sync}>
          <span className="line__label">Cola de envío</span>
          {pending > 0 ? <Tag tone="rouge">{pending} por enviar</Tag> : <Tag tone="ok">Al día</Tag>}
        </Link>
      </div>
    </MobileScreen>
  )
}
