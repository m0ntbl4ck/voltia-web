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
