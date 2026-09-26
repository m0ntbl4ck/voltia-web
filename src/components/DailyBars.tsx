import { formatDay, formatInt } from '../lib/format'

interface Props {
  daily: { date: string; kwh: number }[]
  /** How many of the last days feed the comparison with the baseline. */
  recent?: number
}

export function DailyBars({ daily, recent = 2 }: Props) {
  if (daily.length === 0) return null
  const max = Math.max(...daily.map((d) => d.kwh))
  const w = 520
  const h = 150
  const gap = 6
  const bar = (w - gap * (daily.length - 1)) / daily.length
  const y = (v: number) => h - (v / max) * (h - 4)

  return (
    <svg
      className="bars"
      viewBox={`0 0 ${w} ${h + 22}`}
      role="img"
      aria-label={`Consumo diario de la planta del ${formatDay(daily[0].date)} al ${formatDay(daily[daily.length - 1].date)}: entre ${formatInt(Math.min(...daily.map((d) => d.kwh)))} y ${formatInt(max)} kWh por día`}
    >
      {daily.map((d, i) => (
        <rect
          key={d.date}
          className={i >= daily.length - recent ? 'bar recent' : 'bar'}
          x={i * (bar + gap)}
          y={y(d.kwh)}
          width={bar}
          height={h - y(d.kwh)}
        />
      ))}
      <text className="bars-label" x="0" y={h + 16}>
        {formatDay(daily[0].date)}
      </text>
      <text className="bars-label" x={w} y={h + 16} textAnchor="end">
        {formatDay(daily[daily.length - 1].date)}
      </text>
    </svg>
  )
}
