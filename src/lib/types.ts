export interface User {
  id: string
  email: string
  name: string
}

export type StageName =
  | 'READINGS'
  | 'BASELINE'
  | 'DETECTION'
  | 'CORRELATION'
  | 'EVENTS'
  | 'EXPLANATION'
  | 'RECOMMENDATION'

export interface Stage {
  name: StageName
  status: 'PENDING' | 'RUNNING' | 'DONE'
}

export interface RunSummary {
  anomalies: number
  by_type: Record<string, number>
  by_severity: Record<string, number>
  confidence: number
  failures: { meter_id: string; error: string }[]
  error?: string
}

export interface Run {
  id: string
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  current_stage: string
  progress: number
  stages: Stage[]
  summary: RunSummary | null
  started_at: string
  finished_at: string | null
}

export interface Dashboard {
  has_analysis: boolean
  last_analysis: Run | null
  kpis: {
    meters: { total: number; ok: number; alert: number; critical: number }
    period_consumption_kwh: number
    variation_pct: number
    unresolved_anomalies: number
    pending_high_priority: number
    confidence: number | null
  }
  period: { from: string; to: string }
}

export type MeterStatus = 'ok' | 'alert' | 'critical'
export type Severity = 'HIGH' | 'MEDIUM' | 'LOW'
export type AnomalyType = 'REAL_ANOMALY' | 'EXPLAINABLE_ANOMALY' | 'FALSE_POSITIVE' | 'DATA_QUALITY'

export interface Meter {
  meter_id: string
  name: string
  location: string
  status: MeterStatus
  has_baseline: boolean
  recent_daily_kwh: number
  baseline_daily_kwh: number
  variation_pct: number
  last_reading_at: string | null
  last_reading_status: string
  open_anomalies: number
  top_severity: Severity | null
  daily: { date: string; kwh: number }[]
}

export interface Level {
  recent: number
  baseline: number
}

export interface MeterAnomaly {
  id: string
  type: AnomalyType
  severity: Severity
  confidence: number
  anomaly: string
  priority: number
  status: string
  ongoing: boolean
  episode_start: string
  episode_end: string
}

export interface MeterDetail extends Meter {
  electrical: { voltage_v: Level; current_a: Level; power_factor: Level } | null
  anomalies: MeterAnomaly[]
}

export type VariableKey = 'consumption_kwh' | 'voltage_v' | 'current_a' | 'power_factor'

export interface Point {
  timestamp: string
  consumption_kwh: number
  voltage_v: number
  current_a: number
  power_factor: number
  hours: number
}

export interface Baseline {
  reference_start: string
  reference_end: string
  band_z: number
  daily_kwh: number
  profile: Record<VariableKey, { hour: number; median: number; sigma: number }[]>
}

export interface Series {
  meter_id: string
  resolution: 'hour' | 'day'
  points: Point[]
  baseline: Baseline | null
}

export interface MeterEvent {
  type: 'OPERATIONAL_CHANGE' | 'SCHEDULED_OUTAGE' | 'DATA_QUALITY' | 'UNKNOWN'
  timestamp: string
  description: string
  duration_hours: number | null
}
