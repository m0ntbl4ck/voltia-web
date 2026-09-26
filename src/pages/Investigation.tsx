import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Breakdown } from '../components/Breakdown'
import { Chip } from '../components/StatusChip'
import { api, ApiError } from '../lib/api'
import { formatDateTime, plantDate } from '../lib/plant'
import { formatDecimal, formatInt, formatPct, formatSignedPct } from '../lib/format'
import { VARIABLES } from '../lib/series'
import {
  ACTION_LABEL,
  anomalyKind,
  CHECK_LABEL,
  ROLE_LABEL,
  SEVERITY_LABEL,
  SIGNAL_LABEL,
  STATUS_LABEL,
  TYPE_LABEL,
} from '../lib/status'
import type { Action, AnomalyDetail, Series, Signal, VariableKey } from '../lib/types'

const SeriesChart = lazy(() => import('../components/SeriesChart').then((m) => ({ default: m.SeriesChart })))

const DAY = 864e5
const shift = (iso: string, days: number) => new Date(Date.parse(iso) + days * DAY).toISOString()

/** One row per variable: the strongest signal is the before and after. */
function beforeAfter(signals: Signal[]) {
  const byVar = new Map<VariableKey, Signal>()
  for (const s of signals) {
    if (s.kind === 'ISOLATION_FOREST' || s.kind === 'HOURLY_PATTERN' || s.expected === 0) continue
    const current = byVar.get(s.variable)
    const rank = (x: Signal) => (x.kind === 'PERSISTENT_SHIFT' ? 2 : 1)
    if (!current || rank(s) > rank(current)) byVar.set(s.variable, s)
  }
  return [...byVar.values()]
}

const signalName = (s: Signal) =>
  s.check ? `${SIGNAL_LABEL[s.kind] ?? s.kind}, ${CHECK_LABEL[s.check] ?? s.check}` : (SIGNAL_LABEL[s.kind] ?? s.kind)

export function Investigation() {
  const { anomalyId = '' } = useParams()
  const qc = useQueryClient()
  const [variable, setVariable] = useState<VariableKey>('consumption_kwh')
  const [pending, setPending] = useState<Action | null>(null)
  const [note, setNote] = useState('')
  const noteField = useRef<HTMLTextAreaElement>(null)

  // Opening the confirm form moves focus into it; the buttons it replaces are gone.
  useEffect(() => {
    if (pending) noteField.current?.focus()
  }, [pending])

  const anomaly = useQuery({
    queryKey: ['anomalies', anomalyId],
    queryFn: () => api.get<AnomalyDetail>(`/anomalies/${anomalyId}`),
  })
  const a = anomaly.data

  const range = useMemo(
    () => (a ? { from: plantDate(shift(a.episode_start, -3)), to: plantDate(shift(a.episode_end, 2)) } : null),
    [a],
  )
  const series = useQuery({
    queryKey: ['meters', a?.meter_id, 'readings', range],
    queryFn: () => api.get<Series>(`/meters/${a!.meter_id}/readings?include=baseline&from=${range!.from}&to=${range!.to}`),
    enabled: Boolean(a && range),
  })

  const act = useMutation({
    mutationFn: (action: Action) => api.post<AnomalyDetail>(`/anomalies/${anomalyId}/actions`, { action, note: note.trim() || undefined }),
    onSuccess: (updated) => {
      qc.setQueryData(['anomalies', anomalyId], updated)
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      void qc.invalidateQueries({ queryKey: ['meters'] })
      void qc.invalidateQueries({ queryKey: ['anomalies'] })
      setPending(null)
      setNote('')
      requestAnimationFrame(() => document.getElementById('act-title')?.focus())
    },
  })

  if (anomaly.isError) {
    const missing = anomaly.error instanceof ApiError && anomaly.error.status === 404
    return (
      <div className="panel state" role="alert">
        <h1>{missing ? 'Esa anomalía no existe' : 'No se pudo leer la anomalía'}</h1>
        <p>{missing ? 'Puede que un análisis nuevo la haya reemplazado.' : 'El servidor no respondió como se esperaba.'}</p>
        {missing ? (
          <Link className="btn" to="/anomalias">
            Volver a anomalías
          </Link>
        ) : (
          <button type="button" className="btn" onClick={() => void anomaly.refetch()}>
            Reintentar
          </button>
        )}
      </div>
    )
  }
  if (!a) {
    return (
      <div role="status">
        <span className="visually-hidden">Cargando la anomalía…</span>
        <div className="skeleton" style={{ minHeight: 320 }} aria-hidden="true" />
      </div>
    )
  }

  const cb = a.confidence_breakdown
  const pb = a.priority_breakdown
  const rows = beforeAfter(a.evidence.signals)
  const closed = a.status === 'RESOLVED' || a.status === 'DISMISSED'
  const others = a.available_actions.filter((x) => x !== a.recommended_next_action)
  const actionError =
    act.error instanceof ApiError
      ? act.error.status === 409
        ? 'Esa acción ya no está permitida en el estado actual de la anomalía.'
        : 'No se pudo aplicar la acción. Reintenta en unos segundos.'
      : null

  return (
    <>
      <p className="crumb">
        <Link to="/anomalias">Anomalías IA</Link>
      </p>

      <div className="page-head detail-head">
        <div>
          <h1>{a.anomaly}</h1>
          <p>
            <Link to={`/medidores/${a.meter_id}`}>
              <span className="mono">{a.meter_id}</span> {a.meter_name}
            </Link>
            , {a.location}
          </p>
        </div>
        <div className="head-facts">
          <Chip kind={anomalyKind(a.type, a.severity)} label={TYPE_LABEL[a.type]} />
          <span className="cell-sub">
            Severidad {SEVERITY_LABEL[a.severity].toLowerCase()} · {STATUS_LABEL[a.status].toLowerCase()}
          </span>
        </div>
      </div>

      <div className="invest">
        <div className="invest-main">
          <section className="panel" aria-labelledby="why-title">
            <div className="section-head">
              <h2 id="why-title">Qué encontró el análisis</h2>
              <span className="source" title={a.explanation_model || undefined}>
                {a.explanation_source === 'LLM' ? `Redactado por ${a.explanation_model}` : 'Texto de plantilla'}
              </span>
            </div>
            <p className="narrative">{a.reason}</p>
            <p className="cell-sub">
              El motor decidió el tipo, la severidad, la prioridad y la confianza con reglas. El texto solo las cuenta.
            </p>
          </section>

          <section className="panel chart-panel" aria-labelledby="ep-title">
            <div className="chart-head">
              <h2 id="ep-title">{VARIABLES.find((v) => v.key === variable)!.label} durante el episodio</h2>
              <div className="tabs" role="group" aria-label="Variable de la gráfica">
                {VARIABLES.map((v) => (
                  <button
                    key={v.key}
                    type="button"
                    className="filter"
                    aria-pressed={variable === v.key}
                    onClick={() => setVariable(v.key)}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            {series.isPending && (
              <div role="status">
                <span className="visually-hidden">Cargando las lecturas…</span>
                <div className="skeleton" style={{ minHeight: 300 }} aria-hidden="true" />
              </div>
            )}
            {series.isError && (
              <div className="state" role="alert">
                <p>No se pudieron leer las lecturas del episodio.</p>
                <button type="button" className="btn" onClick={() => void series.refetch()}>
                  Reintentar
                </button>
              </div>
            )}
            {series.data && (
              <div
                role="img"
                aria-label={`${VARIABLES.find((v) => v.key === variable)!.label} de ${a.meter_id} desde tres días antes del episodio. La zona sombreada es el episodio, del ${formatDateTime(a.episode_start)} al ${formatDateTime(a.episode_end)}.`}
              >
                <Suspense fallback={<div className="skeleton" style={{ minHeight: 300 }} aria-hidden="true" />}>
                  <SeriesChart
                    points={series.data.points}
                    baseline={series.data.baseline}
                    variable={variable}
                    anomalies={[a]}
                    events={a.evidence.events}
                  />
                </Suspense>
              </div>
            )}
            <p className="chart-legend">
              Episodio del {formatDateTime(a.episode_start)} al {formatDateTime(a.episode_end)}
              {a.ongoing ? ', en curso' : ''}. {formatInt(a.evidence.duration_hours)} h ·{' '}
              {formatSignedPct(a.evidence.variation_pct)} · {formatInt(a.evidence.excess_kwh)} kWh de exceso.
            </p>
          </section>

          {rows.length > 0 && (
            <section className="panel" aria-labelledby="ba-title">
              <h2 id="ba-title">Antes y ahora</h2>
              <div className="table-wrap plain">
                <table className="table compact">
                  <thead>
                    <tr>
                      <th scope="col">Variable</th>
                      <th scope="col" className="num">
                        Esperado
                      </th>
                      <th scope="col" className="num">
                        Observado
                      </th>
                      <th scope="col" className="num">
                        Cambio
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s) => {
                      const v = VARIABLES.find((x) => x.key === s.variable)!
                      return (
                        <tr key={s.variable}>
                          <th scope="row">{v.label}</th>
                          <td className="num">
                            {formatDecimal(s.expected, v.digits)} {v.unit}
                          </td>
                          <td className="num">
                            {formatDecimal(s.observed, v.digits)} {v.unit}
                          </td>
                          <td className="num">{formatSignedPct(((s.observed - s.expected) / s.expected) * 100)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <section className="panel" aria-labelledby="ev-title">
            <h2 id="ev-title">Eventos y cómo se trataron</h2>
            {a.evidence.events.length === 0 ? (
              <p className="cell-muted">No hay eventos reportados cerca del episodio.</p>
            ) : (
              <ul className="plain-list">
                {a.evidence.events.map((e) => (
                  <li key={`${e.timestamp}-${e.type}`}>
                    <strong>{ROLE_LABEL[e.role]}</strong>
                    <p>{e.description}</p>
                    <span className="cell-sub">
                      {formatDateTime(e.timestamp)}
                      {e.duration_hours ? ` · ${formatInt(e.duration_hours)} h` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel" aria-labelledby="sig-title">
            <h2 id="sig-title">Evidencia por detector</h2>
            <div className="table-wrap plain">
              <table className="table compact">
                <thead>
                  <tr>
                    <th scope="col">Detector</th>
                    <th scope="col">Variable</th>
                    <th scope="col" className="num">
                      Horas
                    </th>
                    <th scope="col" className="num">
                      Esperado
                    </th>
                    <th scope="col" className="num">
                      Observado
                    </th>
                    <th scope="col" className="num">
                      z medio
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {a.evidence.signals.map((s, i) => {
                    const v = VARIABLES.find((x) => x.key === s.variable)
                    const forest = s.kind === 'ISOLATION_FOREST'
                    return (
                      <tr key={i}>
                        <th scope="row">{signalName(s)}</th>
                        <td>{v?.label ?? s.variable}</td>
                        <td className="num">{s.hours}</td>
                        <td className="num">{forest ? 'Umbral 0,6' : formatDecimal(s.expected, v?.digits ?? 1)}</td>
                        <td className="num">
                          {forest ? `Puntaje ${formatDecimal(s.observed, 2)}` : formatDecimal(s.observed, v?.digits ?? 1)}
                        </td>
                        <td className="num">{forest ? 'No aplica' : formatDecimal(s.mean_z, 1)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <aside className="invest-side">
          <section className="panel act" aria-labelledby="act-title">
            <h2 id="act-title" tabIndex={-1}>
              Qué hacer
            </h2>
            <p>{a.recommended_action}</p>

            {closed ? (
              <p className="cell-muted" role="status">
                Esta anomalía está {STATUS_LABEL[a.status].toLowerCase()}. No admite más acciones.
              </p>
            ) : pending ? (
              <form
                className="confirm"
                onSubmit={(e) => {
                  e.preventDefault()
                  act.mutate(pending)
                }}
              >
                <p>
                  <strong>{ACTION_LABEL[pending]}</strong>
                </p>
                <div className="field">
                  <label htmlFor="note">Nota (opcional)</label>
                  <textarea id="note" ref={noteField} rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
                {actionError && (
                  <div className="form-error" role="alert">
                    {actionError}
                  </div>
                )}
                <div className="confirm-buttons">
                  <button type="submit" className="btn btn-primary" disabled={act.isPending}>
                    {act.isPending ? 'Aplicando…' : `Confirmar: ${ACTION_LABEL[pending].toLowerCase()}`}
                  </button>
                  <button
                    type="button"
                    className="btn"
                    disabled={act.isPending}
                    onClick={() => {
                      setPending(null)
                      requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-action="${pending}"]`)?.focus())
                    }}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="act-buttons">
                {a.recommended_next_action && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    data-action={a.recommended_next_action}
                    onClick={() => setPending(a.recommended_next_action)}
                  >
                    {ACTION_LABEL[a.recommended_next_action]}
                  </button>
                )}
                {others.map((x) => (
                  <button key={x} type="button" className="btn" data-action={x} onClick={() => setPending(x)}>
                    {ACTION_LABEL[x]}
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="panel" aria-labelledby="steps-title">
            <h2 id="steps-title">Pasos de investigación</h2>
            <ol className="steps">
              {a.investigation_steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </section>

          <section className="panel" aria-labelledby="prio-title">
            <div className="section-head">
              <h2 id="prio-title">Prioridad</h2>
              <span className="prio-total">{a.priority}</span>
            </div>
            <Breakdown
              unit="pts"
              rows={[
                { label: 'Severidad', value: pb.severity, max: 50 },
                { label: 'Tipo', value: pb.type, max: 25 },
                { label: 'Impacto en kWh', value: pb.impact, max: 15 },
                { label: 'Sigue en curso', value: pb.recency, max: 10 },
              ]}
            />
          </section>

          <section className="panel" aria-labelledby="conf-title">
            <div className="section-head">
              <h2 id="conf-title">Confianza</h2>
              <span className="prio-total">{formatPct(a.confidence)}</span>
            </div>
            <p className="cell-sub">Solidez de la evidencia, no una probabilidad calibrada.</p>
            <Breakdown
              unit="pct"
              rows={[
                { label: 'Coincidencia de detectores', value: cb.detector_agreement, max: 1, note: 'Peso 35 %' },
                { label: 'Fuerza de la señal', value: cb.signal_strength, max: 1, note: 'Peso 30 %' },
                { label: 'Claridad de la clasificación', value: cb.classification_clarity, max: 1, note: 'Peso 25 %' },
                {
                  label: 'Integridad de los datos',
                  value: cb.data_integrity,
                  max: 1,
                  note: cb.integrity_applies ? 'Peso 10 %' : undefined,
                  unavailable: cb.integrity_applies ? undefined : 'No aplica a calidad de datos',
                },
              ]}
            />
          </section>

          <section className="panel" aria-labelledby="hist-title">
            <h2 id="hist-title">Historial</h2>
            {a.actions.length === 0 ? (
              <p className="cell-muted">Todavía no se ha aplicado ninguna acción.</p>
            ) : (
              <ul className="plain-list">
                {a.actions.map((h) => (
                  <li key={h.id}>
                    <strong>{ACTION_LABEL[h.action]}</strong>
                    <span className="cell-sub">
                      {h.user_name} · {formatDateTime(h.created_at)} · {STATUS_LABEL[h.from_status].toLowerCase()} a{' '}
                      {STATUS_LABEL[h.to_status].toLowerCase()}
                    </span>
                    {h.note && <p>{h.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </>
  )
}
