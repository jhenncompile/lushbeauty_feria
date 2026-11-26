import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface DialogProps {
  open: boolean
  title: string
  /** Rótulo corto sobre el título (p. ej. «Confirmar», «Listo», «Sin conexión»). */
  eyebrow?: string
  children?: ReactNode
  actions: ReactNode
  onClose: () => void
}

/**
 * Diálogo modal accesible: foco dentro al abrir (el elemento con `data-autofocus` o el primero),
 * Tab no sale del diálogo, Esc o clic fuera cierran, y al cerrar el foco vuelve a donde estaba.
 */
export function Dialog({ open, title, eyebrow, children, actions, onClose }: DialogProps) {
  const panel = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  const titleId = useId()
  const bodyId = useId()

  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusables = () => Array.from(panel.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])
    const first = panel.current?.querySelector<HTMLElement>('[data-autofocus]') ?? focusables()[0] ?? panel.current
    first?.focus()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusables()
      if (items.length === 0) return
      const start = items[0]
      const end = items[items.length - 1]
      if (event.shiftKey && document.activeElement === start) {
        event.preventDefault()
        end.focus()
      } else if (!event.shiftKey && document.activeElement === end) {
        event.preventDefault()
        start.focus()
      }
    }

    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [open])

  if (!open) return null
  return createPortal(
    <div
      className="lx dlg"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeRef.current()
      }}
    >
      <div
        ref={panel}
        className="dlg__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={children ? bodyId : undefined}
        tabIndex={-1}
      >
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2 id={titleId} className="dlg__title">
          {title}
        </h2>
        {children ? (
          <div id={bodyId} className="dlg__body">
            {children}
          </div>
        ) : null}
        <div className="dlg__actions">{actions}</div>
      </div>
    </div>,
    document.body,
  )
}

interface ConfirmDialogProps {
  open: boolean
  title: string
  children?: ReactNode
  confirmLabel: string
  cancelLabel?: string
  /** Acción destructiva: botón en rojo. */
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/** Pide confirmación antes de una acción que no se puede deshacer. El foco empieza en «Volver», la opción segura. */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  cancelLabel = 'Volver',
  danger,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      eyebrow="Confirmar"
      title={title}
      onClose={onCancel}
      actions={
        <>
          <Button variant="link" onClick={onCancel} data-autofocus>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  )
}

interface NoticeDialogProps {
  open: boolean
  title: string
  eyebrow?: string
  children?: ReactNode
  buttonLabel?: string
  onClose: () => void
}

/** Informa el resultado de una acción; se cierra con un solo botón. */
export function NoticeDialog({ open, title, eyebrow, children, buttonLabel = 'Entendido', onClose }: NoticeDialogProps) {
  return (
    <Dialog
      open={open}
      eyebrow={eyebrow}
      title={title}
      onClose={onClose}
      actions={
        <Button onClick={onClose} data-autofocus>
          {buttonLabel}
        </Button>
      }
    >
      {children}
    </Dialog>
  )
}
