import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage, RequireRole } from '../modules/identity'
import { ROUTES } from '../shared/layout'
import { ShellHome } from './ShellHome'

const ADMIN = ['administradora'] as const
const SPECIALIST = ['especialista'] as const

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.login} replace />} />
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route
        path={ROUTES.home}
        element={
          <RequireRole allow={ADMIN}>
            <ShellHome title="Hoy" />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.cashClose}
        element={
          <RequireRole allow={ADMIN}>
            <ShellHome title="Cierre de caja" />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.register}
        element={
          <RequireRole allow={SPECIALIST}>
            <ShellHome title="Registrar servicio" />
          </RequireRole>
        }
      />
      <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
    </Routes>
  )
}
