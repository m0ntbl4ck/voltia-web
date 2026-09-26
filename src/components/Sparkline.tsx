import { formatDecimal, formatInt } from '../lib/format'
import type { MeterStatus } from '../lib/types'

interface Props {
  values: number[]
  expected: number
  status: MeterStatus
  width?: number
  height?: number
}

// The list endpoint gives the expected daily level but no band width, so the reference is a line.
export function Sparkline({ values, expected, status, width = 112, height = 28 }: Props) {
  if (values.length === 0) return null
  const all = [...values, expected]
  const min = Math.min(...all)
  const max = Math.max(...all)
  const span = max - min || 1
  const pad = 3
  const x = (i: number) => pad + (i * (width - pad * 2)) / Math.max(values.length - 1, 1)
  const y = (v: number) => height - pad - ((v - min) * (height - pad * 2)) / span
  const points = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const last = values.length - 1

  return (
    <svg
      className="spark"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Consumo diario de los últimos ${values.length} días: entre ${formatInt(Math.min(...values))} y ${formatInt(Math.max(...values))} kWh, esperado ${formatDecimal(expected, 0)} kWh`}
    >
      <line className="spark-ref" x1={pad} x2={width - pad} y1={y(expected)} y2={y(expected)} />
      <polyline className="spark-line" points={points} />
      <circle className="spark-dot" data-status={status} cx={x(last)} cy={y(values[last])} r="2.5" />
    </svg>
  )
}
