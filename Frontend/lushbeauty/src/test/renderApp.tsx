import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppRoutes } from '../app/routes'
import { SessionProvider } from '../modules/identity'
import type { Session } from '../modules/identity'
import { CashProvider } from '../modules/cashier'
import { OfflineProvider, SAMPLE_QUEUE } from '../modules/offline'
import { PayrollProvider } from '../modules/payroll'
import { SalesProvider } from '../modules/sales'

export const ADMIN: Session = { userName: 'marisol', role: 'administradora' }
export const PATY: Session = { userName: 'paty', role: 'especialista' }

/** Monta la app completa en una ruta, con sesión y conexión controladas. */
export function renderApp(path: string, session: Session | null = ADMIN, connection: { online: boolean; pending?: number } = { online: true }) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <OfflineProvider online={connection.online} initialQueue={connection.pending ? SAMPLE_QUEUE : []}>
        <SessionProvider initial={session}>
          <SalesProvider>
            <PayrollProvider>
              <CashProvider>
                <AppRoutes />
              </CashProvider>
            </PayrollProvider>
          </SalesProvider>
        </SessionProvider>
      </OfflineProvider>
    </MemoryRouter>,
  )
}
