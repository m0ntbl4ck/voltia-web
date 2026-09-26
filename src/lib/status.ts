import type { AnomalyType, MeterStatus, Severity } from './types'

export type ChipKind = 'critical' | 'alert' | 'ok' | 'data-quality' | 'false-positive'

export const CHIP_LABEL: Record<ChipKind, string> = {
  critical: 'Crítica',
  alert: 'Alerta',
  ok: 'OK',
  'data-quality': 'Calidad de datos',
  'false-positive': 'Falso positivo',
}

export const meterKind = (s: MeterStatus): ChipKind => (s === 'critical' ? 'critical' : s === 'alert' ? 'alert' : 'ok')

export const meterLabel = (s: MeterStatus) => (s === 'critical' ? 'Crítico' : s === 'alert' ? 'En alerta' : 'OK')

export function anomalyKind(type: AnomalyType, severity: Severity): ChipKind {
  if (type === 'DATA_QUALITY') return 'data-quality'
  if (type === 'FALSE_POSITIVE') return 'false-positive'
  return severity === 'HIGH' ? 'critical' : 'alert'
}

export const TYPE_LABEL: Record<AnomalyType, string> = {
  REAL_ANOMALY: 'Anomalía real',
  EXPLAINABLE_ANOMALY: 'Anomalía explicable',
  FALSE_POSITIVE: 'Falso positivo',
  DATA_QUALITY: 'Calidad de datos',
}

export const SEVERITY_LABEL: Record<Severity, string> = { HIGH: 'Alta', MEDIUM: 'Media', LOW: 'Baja' }
