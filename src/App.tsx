import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'
import { Meters } from './pages/Meters'

// The detail page carries ECharts, so it loads only when a meter is opened.
const MeterDetail = lazy(() => import('./pages/MeterDetail').then((m) => ({ default: m.MeterDetail })))

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
          <Route path="medidores" element={<Meters />} />
          <Route
            path="medidores/:meterId"
            element={
              <Suspense fallback={<p role="status">Cargando el medidor…</p>}>
                <MeterDetail />
              </Suspense>
            }
          />
        </Route>
      </Route>
    </Routes>
  )
}
