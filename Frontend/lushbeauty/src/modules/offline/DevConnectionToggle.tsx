import { useOfflineQueue } from './queue'

/** Solo en desarrollo: alterna la conexión simulada para probar la cola sin tocar las herramientas del navegador. */
export function DevConnectionToggle() {
  const { online, simulateOnline } = useOfflineQueue()
  return (
    <button
      type="button"
      className="lb-btn lb-btn--secondary dev-toggle"
      onClick={() => simulateOnline(!online)}
      aria-pressed={!online}
    >
      {online ? 'Simular sin conexión' : 'Restablecer conexión'}
    </button>
  )
}
