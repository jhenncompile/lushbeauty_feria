interface StatusBarProps {
  online: boolean
  pending?: number
}

export function StatusBar({ online, pending = 0 }: StatusBarProps) {
  if (online) {
    return (
      <div className="status" role="status">
        <span className="dot dot--ok" aria-hidden="true" />
        <span>En línea · todo sincronizado</span>
      </div>
    )
  }
  return (
    <div className="status status--off" role="status">
      <span className="dot dot--ink" aria-hidden="true" />
      <span>Sin conexión · {pending} pendientes</span>
    </div>
  )
}
