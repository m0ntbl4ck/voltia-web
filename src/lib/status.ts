import type { Action, AnomalyStatus, AnomalyType, MeterStatus, Severity } from './types'

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

export const STATUS_LABEL: Record<AnomalyStatus, string> = {
  OPEN: 'Abierta',
  ACKNOWLEDGED: 'Reconocida',
  RESOLVED: 'Resuelta',
  DISMISSED: 'Descartada',
}

export const ACTION_LABEL: Record<Action, string> = {
  CREATE_INSPECTION_ORDER: 'Crear orden de inspección',
  REQUEST_METER_VALIDATION: 'Solicitar validación del medidor',
  CONFIRM_OPERATION: 'Confirmar operación',
  DISMISS: 'Descartar',
  RESOLVE: 'Marcar como resuelta',
}

export const SIGNAL_LABEL: Record<string, string> = {
  PERSISTENT_SHIFT: 'Cambio sostenido',
  SPIKE: 'Pico o caída brusca',
  OUTLIER: 'Lectura atípica',
  ELECTRICAL_RELATION: 'Relación eléctrica',
  DATA_QUALITY: 'Calidad de datos',
  HOURLY_PATTERN: 'Patrón horario',
  ISOLATION_FOREST: 'Isolation Forest',
}

export const CHECK_LABEL: Record<string, string> = {
  power_factor_drop: 'caída del factor de potencia',
  daily_correlation: 'correlación diaria',
  night_day_ratio: 'relación noche y día',
  electrical_jump: 'salto eléctrico',
  impossible_value: 'valor imposible',
  duplicate_timestamp: 'marca de tiempo repetida',
  missing_readings: 'lecturas faltantes',
}

export const ROLE_LABEL = {
  EXPLAINS: 'Explica la anomalía',
  CORROBORATES: 'Respalda el diagnóstico',
  NOT_EXPLANATORY: 'No la explica',
} as const
