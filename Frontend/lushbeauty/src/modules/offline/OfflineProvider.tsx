import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ConnectionContext } from '../../shared/connection'
import { OfflineContext } from './queue'
import type { OfflineApi } from './queue'
import type { QueueItem } from './types'

interface OfflineProviderProps {
  children: ReactNode
  /** Cola inicial (demos y pruebas). La app arranca con la cola vacía. */
  initialQueue?: QueueItem[]
  /** Fuerza la conexión (pruebas); si no se indica, se sigue al navegador. */
  online?: boolean
}

const hhmm = new Intl.DateTimeFormat('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false })

function flush(queue: QueueItem[]): QueueItem[] {
  // El servidor confirma lo pendiente; lo que está en revisión espera a la usuaria.
  return queue.map((item) => (item.status === 'pendiente' ? { ...item, status: 'confirmada' } : item))
}

/**
 * Cola de envío y estado de conexión. Es una simulación: no hay servidor, así que «enviar» solo
 * cambia el estado. La cola no se persiste (IndexedDB llega con F05-T1/T2).
 */
export function OfflineProvider({ children, initialQueue = [], online: forced }: OfflineProviderProps) {
  const [browserOnline, setBrowserOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue)
  const online = forced ?? browserOnline

  function goOnline(next: boolean) {
    setBrowserOnline(next)
    if (next) setQueue(flush)
  }

  useEffect(() => {
    const on = () => {
      setBrowserOnline(true)
      setQueue(flush)
    }
    const off = () => setBrowserOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  const api: OfflineApi = {
    online,
    queue,
    enqueue: (item) =>
      setQueue((current) =>
        current.some((existing) => existing.id === item.id)
          ? current // misma clave: no se duplica
          : [
              {
                ...item,
                timeLabel: `Hoy ${hhmm.format(new Date())}`,
                status: online ? 'confirmada' : 'pendiente',
              },
              ...current,
            ],
      ),
    confirmReview: (id) =>
      setQueue((current) =>
        current.map((item) =>
          item.id === id ? { id: item.id, label: item.label, timeLabel: item.timeLabel, amountCents: item.amountCents, status: online ? 'confirmada' : 'pendiente' } : item,
        ),
      ),
    retry: () => {
      if (!online) return 'offline'
      setQueue(flush)
      return 'sent'
    },
    simulateOnline: goOnline,
  }

  const pending = queue.filter((item) => item.status === 'pendiente').length
  return (
    <OfflineContext value={api}>
      <ConnectionContext value={{ online, pending }}>{children}</ConnectionContext>
    </OfflineContext>
  )
}
