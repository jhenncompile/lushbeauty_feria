import { MobileScreen, ROUTES } from '../../../shared/layout'
import { Conversation } from '../components/Conversation'
import { Suggested } from '../components/Suggested'

export function InsightPage() {
  return (
    <MobileScreen title="Lush Insight" backTo={ROUTES.home}>
      <p className="t-body muted">
        Lush Insight responde con cifras de sus reportes. No modifica registros ni autoriza pagos.
      </p>
      <Conversation />
      <Suggested />
    </MobileScreen>
  )
}
