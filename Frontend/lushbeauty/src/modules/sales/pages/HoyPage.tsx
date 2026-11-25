import { formatBs } from '../../../shared/money'
import { ADMIN_TABS, MobileScreen, ROUTES } from '../../../shared/layout'
import { Link } from 'react-router-dom'
import { useConnection } from '../../../shared/connection'
import { Button, Tag } from '../../../shared/ui'
import { TODAY } from '../fixtures'

export function HoyPage() {
  const { pending } = useConnection()
  const total = TODAY.byMethod.reduce((sum, item) => sum + item.cents, 0)
  return (
    <MobileScreen
      header={
        <header className="bar">
          <span />
          <span className="eyebrow bar__title">Lush Beauty</span>
          <span />
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
      <section className="noir hoy__hero">
        <div className="stack">
          <p className="eyebrow">{TODAY.label} · Hoy</p>
          <p className="hoy__total">{formatBs(total, { decimals: 0 })}</p>
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
        <Link className="line line--link" style={{ marginTop: 'var(--space-2)' }} to={ROUTES.sync}>
          <span className="line__label">Cola de envío</span>
          {pending > 0 ? <Tag tone="rouge">{pending} por enviar</Tag> : <Tag tone="ok">Al día</Tag>}
        </Link>
      </div>
    </MobileScreen>
  )
}
