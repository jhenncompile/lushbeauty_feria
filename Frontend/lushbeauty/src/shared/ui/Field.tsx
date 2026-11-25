import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cx } from './cx'

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
  label: string
  hint?: string
  error?: string
  className?: string
}

export function Field({ label, hint, error, className, id, ...input }: FieldProps) {
  const generated = useId()
  const inputId = id ?? generated
  const messageId = `${inputId}-msg`
  const message = error ? `Error: ${error}` : hint
  return (
    <div className={cx('lb-field', error && 'lb-field--error', className)}>
      <label className="lb-field__label" htmlFor={inputId}>
        {label}
      </label>
      <input
        {...input}
        id={inputId}
        className="lb-field__input"
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
      />
      {message ? (
        <p className="lb-field__msg" id={messageId}>
          {message}
        </p>
      ) : null}
    </div>
  )
}
