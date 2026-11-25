import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../../../shared/layout'
import { Button, Field } from '../../../shared/ui'
import { answerQuestion } from '../domain/answer'
import type { Answer } from '../domain/answer'

interface Exchange {
  question: string
  answer: Answer
}

const INITIAL_QUESTIONS = ['¿Qué servicios tuvieron más descuentos esta semana?', '¿Cuál fue la utilidad neta de octubre?']

function AnswerBlock({ answer }: { answer: Answer }) {
  return (
    <section className="item" aria-label="Respuesta de Lush Insight">
      <p className="eyebrow">Lush Insight responde</p>
      {answer.kind === 'rows' ? (
        <>
          <div>
            {answer.rows.map((row) => (
              <div className="line" key={row.title}>
                <div>
                  <p className="t-body">{row.title}</p>
                  <p className="t-caption">{row.detail}</p>
                </div>
                <span className="line__value">{row.value}</span>
              </div>
            ))}
          </div>
          <p className="t-caption">{answer.summary}</p>
          <Button variant="link" style={{ alignSelf: 'flex-start' }}>{answer.report}</Button>
        </>
      ) : (
        <>
          <p className="t-title">Información insuficiente</p>
          <p className="t-body muted measure">{answer.reason}</p>
          {answer.next ? (
            <Link className="lb-btn lb-btn--link" style={{ alignSelf: 'flex-start' }} to={ROUTES.webDecisions}>
              {answer.next.label}
            </Link>
          ) : null}
        </>
      )}
    </section>
  )
}

/** Conversación de solo lectura: la persona pregunta, el sistema responde con cifras de reportes o dice que no puede. */
export function Conversation({ web }: { web?: boolean }) {
  const [exchanges, setExchanges] = useState<Exchange[]>(() =>
    INITIAL_QUESTIONS.map((question) => ({ question, answer: answerQuestion(question) })),
  )
  const [draft, setDraft] = useState('')
  const ask = (question: string) => {
    const text = question.trim()
    if (!text) return
    setExchanges((current) => [...current, { question: text, answer: answerQuestion(text) }])
    setDraft('')
  }
  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    ask(draft)
  }
  return (
    <>
      <div className="stack--lg stack" aria-live="polite">
        {exchanges.map((exchange, index) => (
          <div className="stack--lg stack" key={index}>
            <div className="bubble" style={web ? { maxWidth: 420 } : undefined}>
              <p className="t-body">{exchange.question}</p>
            </div>
            <AnswerBlock answer={exchange.answer} />
          </div>
        ))}
      </div>
      <form className="row" style={{ alignItems: 'flex-end', flexWrap: 'nowrap' }} onSubmit={onSubmit}>
        <div style={{ flex: 1 }}>
          <Field
            label="Su pregunta"
            hint="Ejemplo: ¿Cuánto se cobró por QR esta semana?"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </div>
        <Button type="submit">Preguntar</Button>
      </form>
    </>
  )
}
