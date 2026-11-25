import { Navigate, Route, Routes } from 'react-router-dom'
import { SincronizacionPage } from '../modules/offline'
import { WebPanelPage } from '../modules/analytics'
import { CierreCajaPage, WebCajaPage } from '../modules/cashier'
import { WebCatalogoPage } from '../modules/catalog'
import { ComparacionPage, HistorialPage, RecomendacionPage, SimuladorPage, WebDecisionesPage } from '../modules/decisions'
import { GuardPage, WebGuardPage } from '../modules/guard'
import { LoginPage, RequireRole, WebAjustesPage } from '../modules/identity'
import { ImportarCargarPage, ImportarRevisarPage, WebImportarPage } from '../modules/imports'
import { InsightPage, WebInsightPage } from '../modules/insight'
import { WebAuditoriaPage } from '../modules/audit'
import { BannerFeriaPage, LandingPage } from '../modules/site'
import {
  AprobadaPage,
  DetalleLiquidacionPage,
  LiquidacionPage,
  MiLiquidacionPage,
  WebNominaPage,
} from '../modules/payroll'
import { DescuentoPage, GuardadoPage, HoyPage, RegistrarPage, WebVentasPage } from '../modules/sales'
import { ROUTES } from '../shared/layout'

const ADMIN = ['administradora'] as const
const SPECIALIST = ['especialista'] as const
const ANYONE_WHO_REGISTERS = ['administradora', 'especialista'] as const

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={ROUTES.landing} replace />} />
      <Route path={ROUTES.landing} element={<LandingPage />} />
      <Route path={ROUTES.fair} element={<BannerFeriaPage />} />
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
            <CierreCajaPage />
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
      <Route
        path={ROUTES.webCash}
        element={
          <RequireRole allow={ADMIN}>
            <WebCajaPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.sync}
        element={
          <RequireRole allow={ANYONE_WHO_REGISTERS}>
            <SincronizacionPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.webPanel}
        element={
          <RequireRole allow={['administradora', 'lector']}>
            <WebPanelPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.import}
        element={
          <RequireRole allow={ADMIN}>
            <ImportarCargarPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.importReview}
        element={
          <RequireRole allow={ADMIN}>
            <ImportarRevisarPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.insight}
        element={
          <RequireRole allow={ADMIN}>
            <InsightPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.guard}
        element={
          <RequireRole allow={ADMIN}>
            <GuardPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.decisions}
        element={
          <RequireRole allow={ADMIN}>
            <SimuladorPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.comparison}
        element={
          <RequireRole allow={ADMIN}>
            <ComparacionPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.recommendation}
        element={
          <RequireRole allow={ADMIN}>
            <RecomendacionPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.history}
        element={
          <RequireRole allow={ADMIN}>
            <HistorialPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.webImport}
        element={
          <RequireRole allow={ADMIN}>
            <WebImportarPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.webInsight}
        element={
          <RequireRole allow={ADMIN}>
            <WebInsightPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.webGuard}
        element={
          <RequireRole allow={ADMIN}>
            <WebGuardPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.webDecisions}
        element={
          <RequireRole allow={ADMIN}>
            <WebDecisionesPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.webSettings}
        element={
          <RequireRole allow={ADMIN}>
            <WebAjustesPage />
          </RequireRole>
        }
      />
      <Route
        path={ROUTES.webAudit}
        element={
          <RequireRole allow={ADMIN}>
            <WebAuditoriaPage />
          </RequireRole>
        }
      />
      <Route path="*" element={<Navigate to={ROUTES.login} replace />} />
    </Routes>
  )
}
