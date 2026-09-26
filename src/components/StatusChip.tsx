import { CHIP_LABEL, type ChipKind } from '../lib/status'

// Each state has its own shape so it never depends on color alone (DESIGN.md section 4).
function Shape({ kind }: { kind: ChipKind }) {
  return (
    <svg className="chip-shape" viewBox="0 0 12 12" aria-hidden="true">
      {kind === 'critical' && <rect x="1.5" y="1.5" width="9" height="9" />}
      {kind === 'alert' && <polygon points="6,1 11,10.5 1,10.5" />}
      {kind === 'ok' && <circle cx="6" cy="6" r="4.75" />}
      {kind === 'data-quality' && <polygon points="6,0.75 10.5,3.4 10.5,8.6 6,11.25 1.5,8.6 1.5,3.4" />}
      {kind === 'false-positive' && (
        <>
          <circle cx="6" cy="6" r="4.75" className="ring" />
          <line x1="3.5" y1="6" x2="8.5" y2="6" className="bar" />
        </>
      )}
    </svg>
  )
}

export function Chip({ kind, label }: { kind: ChipKind; label?: string }) {
  return (
    <span className="chip" data-kind={kind}>
      <Shape kind={kind} />
      {label ?? CHIP_LABEL[kind]}
    </span>
  )
}
