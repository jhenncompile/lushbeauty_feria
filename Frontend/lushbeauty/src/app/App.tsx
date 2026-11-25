import { BrowserRouter } from 'react-router-dom'
import { SessionProvider } from '../modules/identity'
import { SalesProvider } from '../modules/sales'
import { AppRoutes } from './routes'

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <SalesProvider>
          <AppRoutes />
        </SalesProvider>
      </SessionProvider>
    </BrowserRouter>
  )
}
