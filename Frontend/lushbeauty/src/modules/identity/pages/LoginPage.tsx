import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES, useDocumentTitle } from '../../../shared/layout'
import { ART, Button, Field, Wordmark } from '../../../shared/ui'
import { login, LoginError } from '../api/auth'
import { homeRouteFor } from '../domain/access'
import { useSession } from '../session'

export function LoginPage() {
  useDocumentTitle('Ingresar · Lush Beauty Smart')
  const { signIn } = useSession()
  const navigate = useNavigate()
  const [user, setUser] = useState('')
  const [secret, setSecret] = useState('')
  const [errors, setErrors] = useState<{ user?: string; secret?: string }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const next = {
      user: user.trim() ? undefined : 'Ingrese su usuario.',
      secret: secret ? undefined : 'Ingrese su contraseña o PIN.',
    }
    setErrors(next)
    setFormError(null)
    if (next.user || next.secret) return
    setBusy(true)
    try {
      const session = await login(user.trim(), secret)
      signIn(session)
      const wide = typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 1000px)').matches
      navigate(homeRouteFor(session.role, wide), { replace: true })
    } catch (error) {
      setFormError(error instanceof LoginError ? error.message : 'No se pudo ingresar. Intente de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="lx web login">
      <section className="lb-on-inverse rel login__brand">
        <div className="login__orbit" aria-hidden="true">
          <img src={ART.cover} alt="" style={{ width: '100%', height: '100%' }} />
        </div>
        <div className="above rise d2">
          <Wordmark variant="stacked" tone="inverse" size={28} descriptor="Salón de belleza" />
        </div>
        <p className="t-caption above rise d4">El arte del detalle, con las cuentas claras.</p>
      </section>
      <main className="login__main">
        <form className="stack stack--lg login__form rise d3" onSubmit={onSubmit} noValidate>
          <div className="stack" style={{ gap: 'var(--space-2)' }}>
            <p className="eyebrow">Lush Beauty Smart</p>
            <h1 className="display-lg">Ingresar</h1>
          </div>
          <Field
            label="Usuario"
            name="usuario"
            autoComplete="username"
            value={user}
            onChange={(event) => setUser(event.target.value)}
            hint="Su correo o nombre de usuario."
            error={errors.user}
          />
          <Field
            label="Contraseña o PIN"
            name="secreto"
            type="password"
            autoComplete="current-password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            hint="Las especialistas pueden usar el PIN de 6 dígitos."
            error={errors.secret}
          />
          <div className="stack">
            {formError && (
              <p role="alert" className="t-caption">
                Error: {formError}
              </p>
            )}
            <Button type="submit" block disabled={busy}>
              {busy ? 'Ingresando…' : 'Ingresar'}
            </Button>
          </div>
          <Link className="lb-btn lb-btn--link" style={{ alignSelf: 'flex-start' }} to={ROUTES.landing}>
            Volver al inicio
          </Link>
          <p className="t-caption">
            Si su cuenta es de especialista, solo verá sus propios servicios y su liquidación.
          </p>
        </form>
      </main>
    </div>
  )
}
