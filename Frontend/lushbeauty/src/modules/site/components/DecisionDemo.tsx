import { useState } from 'react'
import { Button, NoticeDialog } from '../../../shared/ui'

const ANSWERS = {
  aprobar: {
    title: 'Solo la administradora aprueba',
    text: 'Ejemplo: en la aplicación, solo la administradora aprueba y queda en el historial.',
  },
  descartar: {
    title: 'Descartar no cambia nada',
    text: 'Ejemplo: descartar no cambia ningún precio ni comisión.',
  },
} as const

/** Ejemplo de la recomendación: los botones no navegan ni cambian nada; explican quién decide. */
export function DecisionDemo() {
  const [answer, setAnswer] = useState<keyof typeof ANSWERS>()
  return (
    <>
      <div className="row">
        <Button onClick={() => setAnswer('aprobar')}>Aprobar</Button>
        <Button variant="secondary" onClick={() => setAnswer('descartar')}>
          Descartar
        </Button>
      </div>
      <p className="t-caption">Escenario hipotético e ilustrativo. Pruebe los botones: no cambian nada.</p>
      <NoticeDialog
        open={answer !== undefined}
        eyebrow="Ejemplo"
        title={answer ? ANSWERS[answer].title : ''}
        onClose={() => setAnswer(undefined)}
      >
        <p>{answer ? ANSWERS[answer].text : null}</p>
      </NoticeDialog>
    </>
  )
}
