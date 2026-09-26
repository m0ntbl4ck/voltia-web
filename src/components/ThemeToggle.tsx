import { useTheme } from '../lib/theme'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()
  const target = theme === 'dark' ? 'claro' : 'oscuro'
  return (
    <button type="button" className="theme-toggle" onClick={toggle}>
      Modo {target}
    </button>
  )
}
