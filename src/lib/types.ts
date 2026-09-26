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
  attention: Anomaly[]
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

export type AnomalyStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED'
export type Action =
  | 'CREATE_INSPECTION_ORDER'
  | 'REQUEST_METER_VALIDATION'
  | 'CONFIRM_OPERATION'
  | 'DISMISS'
  | 'RESOLVE'

export interface Anomaly {
  id: string
  meter_id: string
  meter_name: string
  location: string
  anomaly: string
  type: AnomalyType
  severity: Severity
  confidence: number
  reason: string
  recommended_action: string
  priority: number
  status: AnomalyStatus
  ongoing: boolean
  episode_start: string
  episode_end: string
  detected_at: string
  recommended_next_action: Action | null
  available_actions: Action[]
  explanation_source: 'TEMPLATE' | 'LLM'
  explanation_model: string
}

export interface Signal {
  kind: string
  check?: string
  variable: VariableKey
  start: string
  end: string
  hours: number
  direction: number
  observed: number
  expected: number
  mean_z: number
}

export interface EvidenceEvent extends MeterEvent {
  role: 'EXPLAINS' | 'CORROBORATES' | 'NOT_EXPLANATORY'
  offset_hours: number
}

export interface ActionEntry {
  id: string
  action: Action
  note: string
  from_status: AnomalyStatus
  to_status: AnomalyStatus
  user_name: string
  created_at: string
}

export interface AnomalyDetail extends Anomaly {
  investigation_steps: string[]
  evidence: {
    rule: string
    duration_hours: number
    direction: 'UP' | 'DOWN'
    variation_pct: number
    excess_kwh: number
    invalid_readings: number
    signals: Signal[]
    events: EvidenceEvent[]
  }
  confidence_breakdown: {
    detector_agreement: number
    signal_strength: number
    classification_clarity: number
    data_integrity: number
    integrity_applies: boolean
  }
  priority_breakdown: { severity: number; type: number; impact: number; recency: number }
  actions: ActionEntry[]
}
