import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { SeriesChart } from '../components/SeriesChart'
import { Chip } from '../components/StatusChip'
import { api, ApiError } from '../lib/api'
import { formatDateTime, plantDate, plantHour } from '../lib/plant'
import { countOutside, tier, VARIABLES } from '../lib/series'
import { anomalyKind, meterKind, meterLabel, SEVERITY_LABEL, TYPE_LABEL } from '../lib/status'
import { formatDay, formatDecimal, formatInt, formatPct, formatSignedPct } from '../lib/format'
import type { MeterDetail as Detail, MeterEvent, Series, VariableKey } from '../lib/types'

const EVENT_LABEL: Record<MeterEvent['type'], string> = {
  OPERATIONAL_CHANGE: 'Cambio operativo',
  SCHEDULED_OUTAGE: 'Parada programada',
  DATA_QUALITY: 'Calidad de datos',
  UNKNOWN: 'Sin clasificar',
}

export function MeterDetail() {
  const { meterId = '' } = useParams()
  const [variable, setVariable] = useState<VariableKey>('consumption_kwh')

  const meter = useQuery({ queryKey: ['meters', meterId], queryFn: () => api.get<Detail>(`/meters/${meterId}`) })
  const series = useQuery({
    queryKey: ['meters', meterId, 'readings'],
    queryFn: () => api.get<Series>(`/meters/${meterId}/readings?include=baseline`),
  })
  const events = useQuery({
    queryKey: ['meters', meterId, 'events'],
    queryFn: () => api.get<MeterEvent[]>(`/meters/${meterId}/events`),
  })

  const meta = VARIABLES.find((v) => v.key === variable)!
  const outside = useMemo(
    () => (series.data ? countOutside(series.data.points, series.data.baseline, variable) : 0),
    [series.data, variable],
  )
  const daily = useMemo(() => {
    const profile = series.data?.baseline?.profile[variable]
    const byDay = new Map<string, { sum: number; expected: number; n: number }>()
    for (const p of series.data?.points ?? []) {
      const d = plantDate(p.timestamp)
      const cur = byDay.get(d) ?? { sum: 0, expected: 0, n: 0 }
      cur.sum += p[variable]
      cur.expected += profile?.[plantHour(p.timestamp)].median ?? 0
      cur.n += 1
      byDay.set(d, cur)
    }
    const total = variable === 'consumption_kwh'
    return [...byDay].map(([date, v]) => {
      const value = total ? v.sum : v.sum / v.n
      const expected = profile ? (total ? v.expected : v.expected / v.n) : null
      const dev = expected ? ((value - expected) / expected) * 100 : null
      const marks = (meter.data?.anomalies ?? []).filter(
        (a) => plantDate(a.episode_start) <= date && date <= plantDate(a.episode_end),
      )
      return { date, value, expected, dev, marks }
    })
  }, [series.data, variable, meter.data])

  if (meter.isError) {
    const missing = meter.error instanceof ApiError && meter.error.status === 404
    return (
      <div className="panel state" role="alert">
        <h1>{missing ? 'Ese medidor no existe' : 'No se pudo leer el medidor'}</h1>
        <p>
          {missing
            ? `No hay un medidor con el código ${meterId}.`
            : 'El servidor no respondió como se esperaba. Reintenta o revisa que esté arriba.'}
        </p>
        {missing ? (
          <Link className="btn" to="/medidores">
            Volver a medidores
          </Link>
        ) : (
          <button type="button" className="btn" onClick={() => void meter.refetch()}>
            Reintentar
          </button>
        )}
      </div>
    )
  }

  if (meter.isPending) {
    return (
      <div role="status">
        <span className="visually-hidden">Cargando el medidor…</span>
        <div className="skeleton" style={{ minHeight: 320 }} aria-hidden="true" />
      </div>
    )
  }

  const m = meter.data
  return (
    <>
      <p className="crumb">
        <Link to="/medidores">Medidores</Link>
      </p>
      <div className="page-head detail-head">
        <div>
          <h1>
            <span className="mono">{m.meter_id}</span> {m.name}
          </h1>
          <p>{m.location}</p>
        </div>
        <Chip kind={meterKind(m.status)} label={meterLabel(m.status)} />
      </div>

      {m.has_baseline ? (
        <section className="panel kpis detail-kpis" aria-label="Resumen del medidor">
          <div className="kpi">
            <span className="kpi-label">Consumo diario reciente</span>
            <span className="kpi-value">
              {formatInt(m.recent_daily_kwh)} <span className="kpi-unit">kWh</span>
            </span>
            <span className="kpi-note">Promedio de los dos últimos días completos</span>
          </div>
          <div className="kpi">
            <span className="kpi-label">Esperado</span>
            <span className="kpi-value">
              {formatInt(m.baseline_daily_kwh)} <span className="kpi-unit">kWh</span>
            </span>
            <span className="kpi-note">Suma de las medianas horarias</span>
          </div>
          <div className="kpi">
            <span className="kpi-label">Variación</span>
            <span className="kpi-value">{formatSignedPct(m.variation_pct)}</span>
            <span className="kpi-note">Frente a lo esperado</span>
          </div>
          {m.electrical &&
            (
              [
                ['Voltaje', 'V', m.electrical.voltage_v, 1],
                ['Corriente', 'A', m.electrical.current_a, 1],
                ['Factor de potencia', '', m.electrical.power_factor, 2],
              ] as const
            ).map(([label, unit, level, digits]) => (
              <div className="kpi" key={label}>
                <span className="kpi-label">{label}</span>
                <span className="kpi-value">
                  {formatDecimal(level.recent, digits)} <span className="kpi-unit">{unit}</span>
                </span>
                <span className="kpi-note">
                  Esperado {formatDecimal(level.baseline, digits)} {unit}
                </span>
              </div>
            ))}
        </section>
      ) : (
        <div className="panel state">
          <h2>Aún no hay un consumo esperado</h2>
          <p>Este medidor tiene muy pocas lecturas para aprender su comportamiento normal, así que no se calculan variaciones.</p>
        </div>
      )}

      <section className="panel chart-panel" aria-labelledby="chart-title">
        <div className="chart-head">
          <h2 id="chart-title">
            {meta.label} por hora frente a su banda esperada
          </h2>
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
            <div className="skeleton" style={{ minHeight: 320 }} aria-hidden="true" />
          </div>
        )}
        {series.isError && (
          <div className="state" role="alert">
            <p>No se pudieron leer las lecturas.</p>
            <button type="button" className="btn" onClick={() => void series.refetch()}>
              Reintentar
            </button>
          </div>
        )}
        {series.data && series.data.points.length === 0 && (
          <div className="state">
            <p>Este medidor no tiene lecturas para graficar.</p>
          </div>
        )}
        {series.data && series.data.points.length > 0 && (
          <>
            <div
              role="img"
              aria-label={
                series.data.baseline
                  ? `${meta.label} por hora de ${m.meter_id}: ${outside} de ${series.data.points.length} lecturas quedaron fuera de la banda esperada.`
                  : `${meta.label} por hora de ${m.meter_id}, sin banda esperada.`
              }
            >
              <SeriesChart
                points={series.data.points}
                baseline={series.data.baseline}
                variable={variable}
                anomalies={m.anomalies}
                events={events.data ?? []}
              />
            </div>
            <p className="chart-legend">
              <span className="legend-band" aria-hidden="true" /> Banda esperada
              {series.data.baseline && ` (mediana ± ${series.data.baseline.band_z} desviaciones robustas)`}.
              {' '}
              {series.data.baseline && `${outside} de ${series.data.points.length} lecturas fuera de la banda.`}
              {events.data && events.data.length > 0 && ' Las líneas punteadas son eventos reportados.'}
              {m.anomalies.length > 0 && ' Las zonas sombreadas son episodios de anomalías abiertas.'}
            </p>
            <details className="chart-data">
              <summary>Ver los datos por día</summary>
              <table className="table day-table">
                <caption className="visually-hidden">
                  {meta.label} por día frente a lo esperado, con los días de anomalías abiertas marcados
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Día</th>
                    <th scope="col" className="num">
                      {meta.label}
                      {meta.unit && ` (${meta.unit}${variable === 'consumption_kwh' ? ' al día' : ', promedio'})`}
                    </th>
                    {series.data.baseline && (
                      <th scope="col" className="num">
                        Frente a lo esperado
                      </th>
                    )}
                    <th scope="col">Anomalía</th>
                  </tr>
                </thead>
                <tbody>
                  {daily.map((d) => {
                    const top = d.marks[0]
                    return (
                      <tr key={d.date} data-kind={top ? anomalyKind(top.type, top.severity) : undefined}>
                        <th scope="row">{formatDay(d.date)}</th>
                        <td className="num">{formatDecimal(d.value, meta.digits)}</td>
                        {series.data.baseline && (
                          <td className="num dev" data-tier={d.dev === null ? 0 : tier(d.dev)}>
                            {d.dev === null ? '' : formatSignedPct(d.dev)}
                          </td>
                        )}
                        <td>
                          {d.marks.map((a) => (
                            <Chip key={a.id} kind={anomalyKind(a.type, a.severity)} label={TYPE_LABEL[a.type]} />
                          ))}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </details>
          </>
        )}
      </section>

      <div className="detail-grid">
        <section className="panel" aria-labelledby="anomalies-title">
          <h2 id="anomalies-title">Anomalías sin resolver</h2>
          {m.anomalies.length === 0 ? (
            <p className="cell-muted">Este medidor no tiene anomalías abiertas.</p>
          ) : (
            <ul className="plain-list">
              {m.anomalies.map((a) => (
                <li key={a.id}>
                  <Chip kind={anomalyKind(a.type, a.severity)} label={TYPE_LABEL[a.type]} />
                  <p>{a.anomaly}</p>
                  <span className="cell-sub">
                    Severidad {SEVERITY_LABEL[a.severity].toLowerCase()} · confianza {formatPct(a.confidence)} · prioridad{' '}
                    {a.priority} · desde {formatDateTime(a.episode_start)}
                    {a.ongoing ? ', en curso' : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel" aria-labelledby="events-title">
          <h2 id="events-title">Eventos reportados</h2>
          {events.isPending && <p role="status">Cargando los eventos…</p>}
          {events.isError && <p role="alert">No se pudieron leer los eventos.</p>}
          {events.data && events.data.length === 0 && (
            <p className="cell-muted">Este medidor no tiene eventos reportados.</p>
          )}
          {events.data && events.data.length > 0 && (
            <ul className="plain-list">
              {events.data.map((e) => (
                <li key={`${e.timestamp}-${e.type}`}>
                  <strong>{EVENT_LABEL[e.type]}</strong>
                  <p>{e.description}</p>
                  <span className="cell-sub">
                    {formatDateTime(e.timestamp)}
                    {e.duration_hours !== null && ` · ${formatDecimal(e.duration_hours, 0)} h`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}
