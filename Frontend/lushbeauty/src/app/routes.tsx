import { Navigate, Route, Routes } from 'react-router-dom'
import { WebCatalogoPage } from '../modules/catalog'
import { LoginPage, RequireRole } from '../modules/identity'
import {
  AprobadaPage,
  DetalleLiquidacionPage,
  LiquidacionPage,
  MiLiquidacionPage,
  WebNominaPage,
} from '../modules/payroll'
import { DescuentoPage, GuardadoPage, HoyPage, RegistrarPage, WebVentasPage } from '../modules/sales'
import { ROUTES } from '../shared/layout'
import { ShellHome } from './ShellHome'

const ADMIN = ['administradora'] as const
const SPECIALIST = ['especialista'] as const
const ANYONE_WHO_REGISTERS = ['administradora', 'especialista'] as const

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.login} replace />} />
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route
        path={ROUTES.home}
        element={
          <RequireRole allow={ADMIN}>
            <HoyPage />
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
          <RequireRole allow={ANYONE_WHO_REGISTERS}>
            <RegistrarPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.discount}
        element={
          <RequireRole allow={ANYONE_WHO_REGISTERS}>
            <DescuentoPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.saved}
        element={
          <RequireRole allow={ANYONE_WHO_REGISTERS}>
            <GuardadoPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.webSales}
        element={
          <RequireRole allow={ADMIN}>
            <WebVentasPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.webCatalog}
        element={
          <RequireRole allow={ADMIN}>
            <WebCatalogoPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.payroll}
        element={
          <RequireRole allow={ADMIN}>
            <LiquidacionPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.payrollApproved}
        element={
          <RequireRole allow={ADMIN}>
            <AprobadaPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.payrollDetail}
        element={
          <RequireRole allow={ADMIN}>
            <DetalleLiquidacionPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.myPayroll}
        element={
          <RequireRole allow={SPECIALIST}>
            <MiLiquidacionPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.webPayroll}
        element={
          <RequireRole allow={ADMIN}>
            <WebNominaPage />
          </RequireRole>
        }
      />
      <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
    </Routes>
  )
}
