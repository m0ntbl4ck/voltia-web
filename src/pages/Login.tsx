import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Logo } from '../components/Logo'
import { ThemeToggle } from '../components/ThemeToggle'
import { ApiError } from '../lib/api'
import { useLogin, useMe } from '../lib/auth'

const demoEmail = import.meta.env.VITE_DEMO_EMAIL as string | undefined
const demoPassword = import.meta.env.VITE_DEMO_PASSWORD as string | undefined
const hasDemo = Boolean(demoEmail && demoPassword)

export function Login() {
  const me = useMe()
  const login = useLogin()
  const navigate = useNavigate()
  const [email, setEmail] = useState(demoEmail ?? '')
  const [password, setPassword] = useState(demoPassword ?? '')

  if (me.data) return <Navigate to="/" replace />

  const submit = (credentials: { email: string; password: string }) =>
    login.mutate(credentials, { onSuccess: () => navigate('/', { replace: true }) })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    submit({ email, password })
  }

  const error = login.error
  const message =
    error instanceof ApiError && error.status === 401
      ? 'El correo o la contraseña no coinciden.'
      : error instanceof ApiError && error.status === 0
        ? 'No se pudo conectar con el servidor. Revisa que esté arriba y reintenta.'
        : error
          ? 'No se pudo iniciar sesión. Reintenta en unos segundos.'
          : null

  return (
    <div className="login">
      <div className="login-panel">
        <Logo />
        <div>
          <h1>Entrar a Voltia</h1>
          <p className="login-lead">Lecturas de medidores, anomalías y qué hacer con ellas.</p>
        </div>
        <form className="login-form" onSubmit={onSubmit} noValidate={false}>
          {message && (
            <div className="form-error" role="alert">
              {message}
            </div>
          )}
          <div className="field">
            <label htmlFor="email">Correo</label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              aria-invalid={error ? true : undefined}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              aria-invalid={error ? true : undefined}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={login.isPending}>
            {login.isPending ? 'Entrando…' : 'Entrar'}
          </button>
          {hasDemo && (
            <button
              type="button"
              className="btn"
              disabled={login.isPending}
              onClick={() => submit({ email: demoEmail!, password: demoPassword! })}
            >
              Entrar como demo
            </button>
          )}
        </form>
        <div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}
