import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../app/routes'
import { ConnectionContext } from '../shared/connection'
import type { ConnectionState } from '../shared/connection'
import { SessionProvider } from '../modules/identity'
import type { Session } from '../modules/identity'
import { PayrollProvider } from '../modules/payroll'
import { SalesProvider } from '../modules/sales'

export const ADMIN: Session = { userName: 'marisol', role: 'administradora' }
export const PATY: Session = { userName: 'paty', role: 'especialista' }

/** Monta la app completa en una ruta, con sesión y conexión controladas. */
export function renderApp(path: string, session: Session | null = ADMIN, connection: ConnectionState = { online: true, pending: 0 }) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ConnectionContext value={connection}>
        <SessionProvider initial={session}>
          <SalesProvider>
            <PayrollProvider>
              <AppRoutes />
            </PayrollProvider>
          </SalesProvider>
        </SessionProvider>
      </ConnectionContext>
    </MemoryRouter>,
  )
}
