import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ART, Backdrop, Button, Field, Wordmark } from '../../../shared/ui'
import { homeRouteFor } from '../domain/access'
import { useSession } from '../session'
import type { Role } from '../types'

export function LoginPage() {
  const { signIn } = useSession()
  const navigate = useNavigate()
  const [user, setUser] = useState('')
  const [secret, setSecret] = useState('')
  const [errors, setErrors] = useState<{ user?: string; secret?: string }>({})

  function enter(role: Role) {
    const next = {
      user: user.trim() ? undefined : 'Ingrese su usuario.',
      secret: secret ? undefined : 'Ingrese su contraseña o PIN.',
    }
    setErrors(next)
    if (next.user || next.secret) return
    signIn({ userName: user.trim(), role })
    const wide = typeof window.matchMedia === 'function' && window.matchMedia('(min-width: 1000px)').matches
    navigate(homeRouteFor(role, wide), { replace: true })
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    enter('administradora')
  }

  return (
    <div className="lx web login">
      <section className="lb-on-inverse rel login__brand">
        <Backdrop />
        <div className="login__orbit" aria-hidden="true">
          <img className="spin" src={ART.orbit} alt="" style={{ width: '100%', height: '100%' }} />
        </div>
        <span />
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
            <Button type="submit" block>
              Ingresar
            </Button>
            <Button variant="link" onClick={() => enter('especialista')} style={{ alignSelf: 'center' }}>
              Ingresar como especialista
            </Button>
          </div>
          <p className="t-caption">
            Si ingresa como especialista, solo verá sus propios servicios y su liquidación. Pantalla con datos
            ilustrativos: aún no hay conexión con el servidor.
          </p>
        </form>
      </main>
    </div>
  )
}
