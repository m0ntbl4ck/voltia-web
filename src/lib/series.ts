import { plantHour } from './plant'
import type { Baseline, Point, VariableKey } from './types'

export const VARIABLES: { key: VariableKey; label: string; unit: string; digits: number }[] = [
  { key: 'consumption_kwh', label: 'Consumo', unit: 'kWh', digits: 1 },
  { key: 'voltage_v', label: 'Voltaje', unit: 'V', digits: 1 },
  { key: 'current_a', label: 'Corriente', unit: 'A', digits: 1 },
  { key: 'power_factor', label: 'Factor de potencia', unit: '', digits: 3 },
]

/** Points outside the expected band, for the text summary. */
export function countOutside(points: Point[], baseline: Baseline | null, variable: VariableKey) {
  if (!baseline) return 0
  const profile = baseline.profile[variable]
  return points.filter((p) => {
    const b = profile[plantHour(p.timestamp)]
    return Math.abs(p[variable] - b.median) > baseline.band_z * b.sigma
  }).length
}

