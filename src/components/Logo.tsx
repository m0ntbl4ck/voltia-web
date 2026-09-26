import { Link } from 'react-router'

export function LogoMark() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect className="logo-band" x="2" y="14" width="28" height="9" rx="1" />
      <polyline className="logo-line" points="3,18.5 12,18.5 18,18.5 24,7" />
      <circle className="logo-dot" cx="25" cy="6" r="3" />
    </svg>
  )
}

export function Logo({ to }: { to?: string }) {
  const content = (
    <>
      <LogoMark />
      <span>Voltia</span>
    </>
  )
  return to ? (
    <Link to={to} className="logo" aria-label="Voltia, ir al dashboard">
      {content}
    </Link>
  ) : (
    <span className="logo">{content}</span>
  )
}
