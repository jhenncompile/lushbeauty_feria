import { useState } from 'react'
import { Button } from '../../../shared/ui'

/** Ejemplo de la recomendación: los botones no navegan ni cambian nada; explican quién decide. */
export function DecisionDemo() {
  const [answer, setAnswer] = useState<string | null>(null)
  return (
    <>
      <div className="row">
        <Button onClick={() => setAnswer('Ejemplo: en la aplicación, solo la administradora aprueba y queda en el historial.')}>
          Aprobar
        </Button>
        <Button variant="secondary" onClick={() => setAnswer('Ejemplo: descartar no cambia ningún precio ni comisión.')}>
          Descartar
        </Button>
      </div>
      <p className="t-caption" role="status">
        {answer ?? 'Escenario hipotético e ilustrativo. Pruebe los botones: no cambian nada.'}
      </p>
    </>
  )
}
