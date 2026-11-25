import { BrowserRouter } from 'react-router-dom'
import { SessionProvider } from '../modules/identity'
import { PayrollProvider } from '../modules/payroll'
import { SalesProvider } from '../modules/sales'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <SalesProvider>
          <PayrollProvider>
            <AppRoutes />
          </PayrollProvider>
        </SalesProvider>
      </SessionProvider>
    </BrowserRouter>
  )
}
