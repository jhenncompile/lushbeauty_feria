import { useState } from 'react'
import { formatBs } from '../../../shared/money'
import { ConfirmDialog, NoticeDialog } from '../../../shared/ui'
import { totals } from '../domain/payroll'
import { useSettlement } from '../settlement'

/**
 * Aprobar la liquidación pide confirmación porque no se puede deshacer.
 * `notify` muestra después un aviso con el resultado (en web); en móvil la pantalla «aprobada» ya es el resultado.
 */
export function useApproveFlow({ notify, onApproved }: { notify?: boolean; onApproved?: () => void } = {}) {
  const settlement = useSettlement()
  const [step, setStep] = useState<'idle' | 'confirm' | 'done'>('idle')
  const sum = totals(settlement.statements)
  const count = settlement.statements.length

  function confirm() {
    if (!settlement.approve()) {
      setStep('idle')
      return
    }
    setStep(notify ? 'done' : 'idle')
    onApproved?.()
  }

  const dialogs = (
    <>
      <ConfirmDialog
        open={step === 'confirm'}
        title="¿Aprobar la liquidación?"
        confirmLabel="Sí, aprobar"
        onConfirm={confirm}
        onCancel={() => setStep('idle')}
      >
        <p>
          {settlement.weekLabel}: <strong>{formatBs(sum.netCents)}</strong> a pagar a {count} especialistas.
        </p>
        <p>Se emiten los comprobantes y se avisa a cada especialista. No se puede deshacer.</p>
      </ConfirmDialog>
      <NoticeDialog open={step === 'done'} eyebrow="Listo" title="Comprobantes emitidos" onClose={() => setStep('idle')}>
        <p>
          La liquidación de la {settlement.weekLabel.toLowerCase()} quedó aprobada. Revise el estado de los avisos a cada
          especialista: los que fallen se pueden reintentar.
        </p>
      </NoticeDialog>
    </>
  )

  return { request: () => setStep('confirm'), dialogs }
}
