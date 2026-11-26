import { useState } from 'react'
import { formatBs } from '../../../shared/money'
import { ConfirmDialog, NoticeDialog } from '../../../shared/ui'
import { useCashClose } from '../cash'

/**
 * Cierre de caja en dos pasos: valida, pide confirmación (no se deshace) y avisa el resultado.
 * Devuelve la acción para el botón y los diálogos a renderizar.
 */
export function useCloseCashFlow() {
  const cash = useCashClose()
  const [step, setStep] = useState<'idle' | 'confirm' | 'done'>('idle')
  const result = cash.reconciliation

  function request() {
    if (cash.validate()) setStep('confirm')
  }

  function confirm() {
    setStep(cash.close() ? 'done' : 'idle')
  }

  const dialogs = (
    <>
      <ConfirmDialog
        open={step === 'confirm'}
        title={`¿Cerrar la caja del ${cash.date}?`}
        confirmLabel="Sí, cerrar caja"
        onConfirm={confirm}
        onCancel={() => setStep('idle')}
      >
        {result ? (
          <p>
            Esperado <strong>{formatBs(result.expectedTotalCents)}</strong> · declarado{' '}
            <strong>{formatBs(result.declaredTotalCents)}</strong>.
          </p>
        ) : null}
        {result && result.cashDiffCents !== 0 ? (
          <p>
            Diferencia en efectivo <strong>{formatBs(result.cashDiffCents)}</strong>, justificada: «
            {cash.justification.trim()}».
          </p>
        ) : null}
        <p>Después del cierre no se edita: cualquier cambio queda como ajuste con historial.</p>
      </ConfirmDialog>
      <NoticeDialog open={step === 'done'} eyebrow="Listo" title="Cierre registrado" onClose={() => setStep('idle')}>
        <p>
          La caja del {cash.date} quedó cerrada
          {result ? <> con <strong>{formatBs(result.declaredTotalCents)}</strong> declarados</> : null}.
        </p>
      </NoticeDialog>
    </>
  )

  return { request, dialogs }
}
