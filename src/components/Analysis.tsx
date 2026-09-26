import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { api, ApiError } from '../lib/api'
import { formatInt, formatPct } from '../lib/format'
import { AnalysisContext } from '../lib/use-analysis'
import type { Run, Stage, StageName } from '../lib/types'

const STAGE_LABEL: Record<StageName, string> = {
  READINGS: 'Lecturas',
  BASELINE: 'Baseline',
  DETECTION: 'Detección',
  CORRELATION: 'Correlación',
  EVENTS: 'Eventos',
  EXPLANATION: 'Explicación',
  RECOMMENDATION: 'Recomendación',
}

const STATE_LABEL: Record<Stage['status'], string> = {
  PENDING: 'Pendiente',
  RUNNING: 'En curso',
  DONE: 'Listo',
}

const isActive = (run?: Run) => run?.status === 'PENDING' || run?.status === 'RUNNING'

export function AnalysisProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLElement | null>(null)
  const [analysisId, setAnalysisId] = useState<string | null>(null)

  const start = useMutation({
    mutationFn: () => api.post<{ analysis_id: string }>('/ai/analyze'),
    onSuccess: ({ analysis_id }) => setAnalysisId(analysis_id),
  })

  const runQuery = useQuery({
    queryKey: ['analysis', analysisId],
    queryFn: () => api.get<Run>(`/ai/analysis/${analysisId}`),
    enabled: analysisId !== null,
    refetchInterval: (query) => (isActive(query.state.data) ? 800 : false),
  })

  const finished = runQuery.data?.status === 'COMPLETED'
  useEffect(() => {
    if (finished) {
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['meters'] })
      void qc.invalidateQueries({ queryKey: ['anomalies'] })
    }
  }, [finished, qc])

  const open = useCallback(() => {
    opener.current = document.activeElement as HTMLElement | null
    if (!dialog.current?.open) dialog.current?.showModal()
  }, [])

  const close = useCallback(() => {
    dialog.current?.close()
    opener.current?.focus()
  }, [])

  const run = useCallback(() => {
    open()
    if (!isActive(runQuery.data) && !start.isPending) {
      setAnalysisId(null)
      start.mutate()
    }
  }, [open, runQuery.data, start])

  const running = start.isPending || isActive(runQuery.data)
  const value = useMemo(() => ({ running, run }), [running, run])

  return (
    <AnalysisContext.Provider value={value}>
      {children}
      <dialog
        ref={dialog}
        className="drawer"
        aria-labelledby="analysis-title"
        onClick={(e) => {
          if (e.target === dialog.current) close()
        }}
        onClose={() => opener.current?.focus()}
      >
        <div className="drawer-inner">
          <div className="drawer-head">
            <h2 id="analysis-title">Análisis</h2>
            <button type="button" className="btn" onClick={close}>
              Cerrar
            </button>
          </div>
          <div className="drawer-body">
            <AnalysisBody
              run={runQuery.data}
              starting={start.isPending}
              error={start.error ?? runQuery.error}
              onRetry={() => {
                setAnalysisId(null)
                start.mutate()
              }}
            />
          </div>
        </div>
      </dialog>
    </AnalysisContext.Provider>
  )
}

function StepMark({ status }: { status: Stage['status'] }) {
  return (
    <svg className="step-mark" viewBox="0 0 14 14" aria-hidden="true">
      {status === 'DONE' && <circle className="fill" cx="7" cy="7" r="6" />}
      {status === 'RUNNING' && <rect className="run" x="1.5" y="1.5" width="11" height="11" rx="1" />}
      {status === 'PENDING' && <circle className="ring" cx="7" cy="7" r="5.5" />}
    </svg>
  )
}

function AnalysisBody({
  run,
  starting,
  error,
  onRetry,
}: {
  run?: Run
  starting: boolean
  error: Error | null
  onRetry: () => void
}) {
  if (error) {
    const message = error instanceof ApiError ? error.message : 'Error inesperado'
    return (
      <div className="form-error" role="alert">
        <div>
          <p>No se pudo ejecutar el análisis. {message}.</p>
          <p>Revisa que el servidor esté arriba y reintenta.</p>
          <p style={{ marginTop: 'var(--space-3)' }}>
            <button type="button" className="btn" onClick={onRetry}>
              Reintentar
            </button>
          </p>
        </div>
      </div>
    )
  }

  if (!run) {
    return <p role="status">{starting ? 'Iniciando el análisis…' : 'Cargando el análisis…'}</p>
  }

  const done = run.stages.filter((s) => s.status === 'DONE').length
  const running = run.stages.find((s) => s.status === 'RUNNING')

  return (
    <>
      <p role="status" aria-live="polite">
        {run.status === 'COMPLETED'
          ? `Análisis completado: ${done} de ${run.stages.length} etapas.`
          : run.status === 'FAILED'
            ? 'El análisis falló.'
            : `Etapa ${done + 1} de ${run.stages.length}: ${running ? STAGE_LABEL[running.name] : 'iniciando'}.`}
      </p>
      <ol className="stepper">
        {run.stages.map((s) => (
          <li key={s.name} className="step" data-status={s.status}>
            <StepMark status={s.status} />
            <span>{STAGE_LABEL[s.name]}</span>
            <span className="step-state">{STATE_LABEL[s.status]}</span>
          </li>
        ))}
      </ol>
      {run.status === 'FAILED' && (
        <div className="form-error" role="alert">
          <div>
            <p>{run.summary?.error ?? 'El motor no pudo terminar.'}</p>
            <p style={{ marginTop: 'var(--space-3)' }}>
              <button type="button" className="btn" onClick={onRetry}>
                Reintentar
              </button>
            </p>
          </div>
        </div>
      )}
      {run.status === 'COMPLETED' && run.summary && <Result summary={run.summary} />}
    </>
  )
}

function Result({ summary }: { summary: NonNullable<Run['summary']> }) {
  const high = summary.by_severity.HIGH ?? 0
  return (
    <div className="result">
      <strong>
        {formatInt(summary.anomalies)} {summary.anomalies === 1 ? 'anomalía' : 'anomalías'}
        {high > 0 && ` · ${formatInt(high)} de severidad alta`}
      </strong>
      <span>Confianza promedio ponderada por severidad: {formatPct(summary.confidence)}.</span>
      {summary.failures.length > 0 && (
        <>
          <span>No se pudieron analizar estos medidores:</span>
          <ul>
            {summary.failures.map((f) => (
              <li key={f.meter_id}>
                <span className="mono">{f.meter_id}</span>: {f.error}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
