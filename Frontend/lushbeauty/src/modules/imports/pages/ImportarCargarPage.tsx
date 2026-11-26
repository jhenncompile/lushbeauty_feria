import { MobileScreen, ROUTES } from '../../../shared/layout'
import { Button } from '../../../shared/ui'
import { FILE, MAPPING } from '../fixtures'

export function ImportarCargarPage() {
  return (
    <MobileScreen
      title="Importar planilla"
      backTo={ROUTES.home}
      footer={
        <>
          <Button block to={ROUTES.importReview}>Previsualizar correcciones</Button>
          <p className="t-caption" style={{ textAlign: 'center' }}>Nada se guarda hasta que usted confirme.</p>
        </>
      }
    >
      <div>
        <p className="eyebrow">Paso 1 de 3 · Mapear columnas</p>
        <h2 className="t-headline" style={{ marginTop: 'var(--space-2)' }}>Planilla de agosto</h2>
      </div>
      <div className="panel">
        <p className="t-title">{FILE.name}</p>
        <p className="t-caption">{FILE.detail}</p>
      </div>
      <table className="tbl tbl--left">
        <thead>
          <tr><th scope="col">Planilla</th><th scope="col">Sistema</th></tr>
        </thead>
        <tbody>
          {MAPPING.map((row) => (
            <tr key={row.source}><td>{row.source}</td><td>{row.target}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="panel">
        <p className="eyebrow">Dato faltante</p>
        <p className="t-body">La planilla no incluye el método de pago. Lo pediremos en la revisión, registro por registro.</p>
      </div>
    </MobileScreen>
  )
}
