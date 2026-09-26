import { Navigate, Outlet } from 'react-router'
import { useMe } from '../lib/auth'

export function RequireAuth() {
  const me = useMe()

  if (me.isPending) return <p role="status" className="state">Comprobando la sesión…</p>
  if (me.isError) {
    return (
      <div className="state" role="alert">
        <h1>No se pudo comprobar la sesión</h1>
        <p>El servidor no respondió. Revisa que esté arriba y reintenta.</p>
        <button type="button" className="btn" onClick={() => void me.refetch()}>
          Reintentar
        </button>
      </div>
    )
  }
  if (me.data === null) return <Navigate to="/login" replace />
  return <Outlet />
}
