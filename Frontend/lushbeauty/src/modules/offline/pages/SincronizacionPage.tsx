import { useState } from 'react'
import { formatBs } from '../../../shared/money'
import { MobileScreen, ROUTES } from '../../../shared/layout'
import { Button, NoticeDialog, Tag } from '../../../shared/ui'
import { useSession } from '../../identity'
import { homeRouteFor } from '../../identity'
import { useOfflineQueue } from '../queue'

const TAG = {
  pendiente: { text: 'Pendiente', tone: undefined },
  confirmada: { text: 'Confirmada', tone: 'ok' as const },
  revision: { text: 'Requiere revisión', tone: 'rouge' as const },
}

export function SincronizacionPage() {
  const { session } = useSession()
  const offline = useOfflineQueue()
  const [result, setResult] = useState<'offline' | 'sent'>()
  const back = session ? homeRouteFor(session.role) : ROUTES.login
  const pending = offline.queue.filter((item) => item.status === 'pendiente').length

  function retry() {
    setResult(offline.retry() === 'offline' ? 'offline' : 'sent')
  }

  return (
    <MobileScreen
      title="Sincronización"
      backTo={back}
      footer={
        <>
          <Button block onClick={retry} disabled={pending === 0}>
            Reintentar envío
          </Button>
          <NoticeDialog
            open={result !== undefined}
            eyebrow={result === 'offline' ? 'Sin conexión' : 'Listo'}
            title={result === 'offline' ? 'Todavía no se pudo enviar' : 'Registros enviados'}
            onClose={() => setResult(undefined)}
          >
            <p>
              {result === 'offline'
                ? 'Sigue sin conexión. Sus registros están a salvo en este teléfono.'
                : 'Los registros pendientes llegaron al servidor.'}
            </p>
          </NoticeDialog>
        </>
      }
    >
      <div>
        <h2 className="t-headline">Cola de envío</h2>
        <p className="t-body muted" style={{ marginTop: 'var(--space-2)' }}>
          {offline.online
            ? 'Hay conexión. Lo pendiente se envía solo.'
            : 'Sus registros están guardados en este teléfono y se enviarán al volver la conexión.'}
        </p>
      </div>
      {offline.queue.length === 0 ? (
        <p className="t-body">No hay registros en la cola. Todo está sincronizado.</p>
      ) : (
        <ul>
          {offline.queue.map((item) => {
            const tag = TAG[item.status]
            return (
              <li className="line" key={item.id}>
                <div style={item.error ? { maxWidth: 210 } : undefined}>
                  <p className="t-body">{item.label}</p>
                  <p className="t-caption">{item.timeLabel}</p>
                  {item.error ? <p className="t-caption rouge">Error: {item.error}</p> : null}
                  {item.status === 'revision' ? (
                    <Button variant="link" onClick={() => offline.confirmReview(item.id)}>
                      Confirmar importe de {formatBs(item.amountCents)}
                    </Button>
                  ) : null}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p className="line__value--md">{formatBs(item.amountCents)}</p>
                  <Tag tone={tag.tone}>{tag.text}</Tag>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      <p className="t-caption">
        Cada registro lleva una clave única: al reintentar no se duplica. Aprobar liquidaciones y cerrar caja requiere
        conexión.
      </p>
    </MobileScreen>
  )
}
