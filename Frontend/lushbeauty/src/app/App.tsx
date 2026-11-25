import { BrowserRouter } from 'react-router-dom'
import { SessionProvider } from '../modules/identity'
import { CashProvider } from '../modules/cashier'
import { DevConnectionToggle, OfflineProvider } from '../modules/offline'
import { PayrollProvider } from '../modules/payroll'
import { SalesProvider } from '../modules/sales'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <OfflineProvider>
        <SalesProvider>
          <PayrollProvider>
            <CashProvider>
              <AppRoutes />
            </CashProvider>
          </PayrollProvider>
        </SalesProvider>
        {import.meta.env.DEV ? <DevConnectionToggle /> : null}
        </OfflineProvider>
      </SessionProvider>
    </BrowserRouter>
  )
}
