import { ADMIN_TABS, MobileScreen, SPECIALIST_TABS } from '../shared/layout'
import { Panel } from '../shared/ui'
import { useSession } from '../modules/identity'

/** Pantalla provisional de F00: demuestra el shell y las pestañas por rol. Cada feature la reemplaza. */
export function ShellHome({ title }: { title: string }) {
  const { session } = useSession()
  const tabs = session?.role === 'especialista' ? SPECIALIST_TABS : ADMIN_TABS
  return (
    <MobileScreen tabs={tabs}>
      <div>
        <p className="eyebrow">{session?.role}</p>
        <h1 className="t-headline" style={{ marginTop: 'var(--space-2)' }}>
          {title}
        </h1>
      </div>
      <Panel>
        <p className="t-body">Sesión iniciada como {session?.userName}. Esta pantalla llega en una próxima feature.</p>
      </Panel>
    </MobileScreen>
  )
}
