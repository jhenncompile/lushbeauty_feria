import { formatBs } from '../../../shared/money'
import { ADMIN_TABS, MobileScreen, ROUTES } from '../../../shared/layout'
import { Button, Field, Stat, Tag } from '../../../shared/ui'
import { useCashClose } from '../cash'
import { useCloseCashFlow } from '../components/useCloseCashFlow'

export function CierreCajaPage() {
  const cash = useCashClose()
  const flow = useCloseCashFlow()
  const result = cash.reconciliation
  const status = result?.cashStatus
  return (
    <MobileScreen
      title="Caja"
      backTo={ROUTES.home}
      tabs={ADMIN_TABS}
      footerBorderless
      footer={
        cash.closed ? (
          <Tag tone="ok">Caja cerrada</Tag>
        ) : (
          <>
            <Button block onClick={flow.request} disabled={!cash.canClose}>
              Cerrar caja
            </Button>
            <p className="t-caption" style={{ textAlign: 'center' }}>
              {cash.canClose
                ? 'El cierre final se registra en línea. Cualquier cambio posterior deja historial.'
                : 'El cierre de caja requiere conexión.'}
            </p>
          </>
        )
      }
    >
      <div>
        <p className="eyebrow">{cash.date}</p>
        <h2 className="t-headline" style={{ marginTop: 'var(--space-2)' }}>
          Cierre de caja
        </h2>
      </div>
      <table className="tbl">
        <thead>
          <tr>
            <th scope="col">Método</th>
            <th scope="col">Esperado</th>
            <th scope="col">Declarado</th>
          </tr>
        </thead>
        <tbody>
          {(result?.rows ?? []).map((row) => (
            <tr key={row.method}>
              <td>{row.method}</td>
              <td>{formatBs(row.expectedCents)}</td>
              <td>{formatBs(row.declaredCents)}</td>
            </tr>
          ))}
          {result ? (
            <tr className="is-total">
              <td>Total</td>
              <td>{formatBs(result.expectedTotalCents)}</td>
              <td>{formatBs(result.declaredTotalCents)}</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {!result ? <p className="t-caption">Cuente el efectivo para ver lo esperado y la diferencia.</p> : null}
      <Field
        label="Efectivo contado (Bs)"
        inputMode="decimal"
        value={cash.countedText}
        onChange={(event) => cash.setCountedText(event.target.value)}
        readOnly={cash.closed}
        hint="Acepta 402, 402,5 o 402,50."
        error={cash.countedError}
      />
      {result && status ? (
        <Stat
          label="Diferencia en efectivo"
          value={status === 'sobra' ? `+ ${formatBs(result.cashDiffCents)}` : formatBs(result.cashDiffCents)}
          delta={
            status === 'conciliado'
              ? 'Conciliado: el efectivo cuadra'
              : status === 'falta'
                ? `Falta ${formatBs(-result.cashDiffCents)} en efectivo`
                : `Sobra ${formatBs(result.cashDiffCents)} en efectivo`
          }
          tone={status === 'conciliado' ? 'up' : status === 'falta' ? 'down' : 'neutral'}
          note="Ilustrativo"
        />
      ) : null}
      <Field
        label="Justificación de la diferencia"
        value={cash.justification}
        onChange={(event) => cash.setJustification(event.target.value)}
        readOnly={cash.closed}
        hint="Obligatoria cuando hay diferencia."
        error={cash.justificationError}
      />
      <p className="t-caption">QR y transferencia se toman iguales a lo esperado en esta maqueta.</p>
      {flow.dialogs}
    </MobileScreen>
  )
}
