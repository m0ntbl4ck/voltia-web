import { NavLink, Outlet } from 'react-router'
import { useLogout, useMe } from '../lib/auth'
import { useAnalysis } from '../lib/use-analysis'
import { AnalysisProvider } from './Analysis'
import { Logo } from './Logo'
import { ThemeToggle } from './ThemeToggle'

function Topbar() {
  const me = useMe()
  const logout = useLogout()
  const { running, run } = useAnalysis()

  return (
    <header className="topbar">
      <button type="button" className="btn btn-primary" onClick={run}>
        {running ? 'Análisis en curso' : 'Ejecutar análisis'}
      </button>
      <ThemeToggle />
      <span className="topbar-user">{me.data?.name}</span>
      <button type="button" className="btn" onClick={() => logout.mutate()} disabled={logout.isPending}>
        Salir
      </button>
    </header>
  )
}

export function AppShell() {
  return (
    <AnalysisProvider>
      <div className="shell">
        <aside className="sidebar">
          <Logo to="/" />
          <nav className="nav" aria-label="Principal">
            <NavLink to="/" end>
              Dashboard
            </NavLink>
            <NavLink to="/medidores">Medidores</NavLink>
            <a href="/api/docs" target="_blank" rel="noreferrer">
              API docs
            </a>
          </nav>
        </aside>
        <Topbar />
        <main className="main">
          <Outlet />
        </main>
      </div>
    </AnalysisProvider>
  )
}
