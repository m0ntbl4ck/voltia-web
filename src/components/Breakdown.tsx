import { formatDecimal } from '../lib/format'

export interface BreakdownRow {
  label: string
  value: number
  max: number
  note?: string
  /** Shown instead of a bar when the component does not apply. */
  unavailable?: string
}

// A plain meter: the fill is the share of the maximum, with the numbers written out beside it.
export function Breakdown({ rows, unit }: { rows: BreakdownRow[]; unit: 'pct' | 'pts' }) {
  return (
    <ul className="breakdown">
      {rows.map((r) => {
        const share = r.max === 0 ? 0 : Math.min(1, r.value / r.max)
        const text = r.unavailable
          ? r.unavailable
          : unit === 'pct'
            ? `${formatDecimal(r.value * 100, 0)} %`
            : `${formatDecimal(r.value, r.value % 1 === 0 ? 0 : 1)} de ${r.max}`
        return (
          <li key={r.label}>
            <div className="breakdown-head">
              <span>{r.label}</span>
              <span className="breakdown-value">{text}</span>
            </div>
            {!r.unavailable && (
              <div className="meter-bar" aria-hidden="true">
                <span style={{ width: `${share * 100}%` }} />
              </div>
            )}
            {r.note && <span className="cell-sub">{r.note}</span>}
          </li>
        )
      })}
    </ul>
  )
}
