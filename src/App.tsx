import { Route, Routes } from 'react-router'
import { AppShell } from './components/AppShell'
import { RequireAuth } from './components/RequireAuth'
import { Dashboard } from './pages/Dashboard'
import { Login } from './pages/Login'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Dashboard />} />
        </Route>
      </Route>
    </Routes>
  )
}
