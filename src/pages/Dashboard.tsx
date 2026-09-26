import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { DailyBars } from '../components/DailyBars'
import { Heatmap } from '../components/Heatmap'
import { Chip } from '../components/StatusChip'
import { useAnalysis } from '../lib/use-analysis'
import { api } from '../lib/api'
import { formatDay, formatInt, formatPct, formatSignedPct } from '../lib/format'
import { ACTION_LABEL, anomalyKind, SEVERITY_LABEL, TYPE_LABEL } from '../lib/status'
import type { Dashboard as DashboardData, Meter } from '../lib/types'

function Kpis({ data }: { data: DashboardData }) {
  const { kpis, period } = data
  return (
    <section className="panel kpis" aria-label="Indicadores del período">
      <div className="kpi kpi-lead">
        <span className="kpi-label">Alta prioridad pendiente</span>
        <span className="kpi-value">{formatInt(kpis.pending_high_priority)}</span>
        <span className="kpi-note">Abiertas de severidad alta que nadie ha atendido</span>
      </div>
      <div className="kpi">
        <span className="kpi-label">Medidores</span>
        <span className="kpi-value">{formatInt(kpis.meters.total)}</span>
        <span className="kpi-note">
          {formatInt(kpis.meters.ok)} OK · {formatInt(kpis.meters.alert)} en alerta ·{' '}
          {formatInt(kpis.meters.critical)} críticos
        </span>
      </div>
      <div className="kpi">
        <span className="kpi-label">Consumo del período</span>
        <span className="kpi-value">
          {formatInt(kpis.period_consumption_kwh)} <span className="kpi-unit">kWh</span>
        </span>
        <span className="kpi-note">
          {formatDay(period.from)} a {formatDay(period.to)}
        </span>
      </div>
      <div className="kpi">
        <span className="kpi-label">Variación</span>
        <span className="kpi-value">{formatSignedPct(kpis.variation_pct)}</span>
        <span className="kpi-note">Consumo diario reciente frente a su baseline</span>
      </div>
      <div className="kpi">
        <span className="kpi-label">Anomalías sin resolver</span>
        <span className="kpi-value">{formatInt(kpis.unresolved_anomalies)}</span>
        <span className="kpi-note">Abiertas y reconocidas</span>
      </div>
      <div className="kpi">
        <span className="kpi-label">Confianza</span>
        <span className="kpi-value">{kpis.confidence === null ? 'Sin dato' : formatPct(kpis.confidence)}</span>
        <span className="kpi-note">Ponderada por severidad</span>
      </div>
    </section>
  )
}

function Attention({ items }: { items: DashboardData['attention'] }) {
  return (
    <section className="panel" aria-labelledby="att-title">
      <div className="section-head">
        <h2 id="att-title">Requiere atención</h2>
        <Link to="/anomalias">Ver todas las anomalías</Link>
      </div>
      {items.length === 0 ? (
        <p className="cell-muted">Ninguna anomalía abierta. Todo lo detectado ya se atendió.</p>
      ) : (
        <ol className="attention">
          {items.map((a) => (
            <li key={a.id}>
              <span className="attention-prio" aria-label={`Prioridad ${a.priority}`}>
                {a.priority}
              </span>
              <div>
                <Chip kind={anomalyKind(a.type, a.severity)} label={TYPE_LABEL[a.type]} />
                <p>
                  <Link to={`/anomalias/${a.id}`}>
                    <span className="mono">{a.meter_id}</span> {a.meter_name}
                  </Link>
                  : {a.anomaly}
                </p>
                <span className="cell-sub">
                  Severidad {SEVERITY_LABEL[a.severity].toLowerCase()} ·{' '}
                  {a.recommended_next_action ? ACTION_LABEL[a.recommended_next_action] : 'Sin acción pendiente'}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function HeatmapPanel() {
  const meters = useQuery({
    queryKey: ['meters', 'heatmap'],
    queryFn: () => api.get<Meter[]>('/meters?sort=severity&order=desc'),
  })
  return (
    <section className="panel heat-panel" aria-labelledby="heat-title">
      <h2 id="heat-title">Cada medidor frente a lo esperado, día por día</h2>
      {meters.isPending && <div className="skeleton" style={{ minHeight: 200 }} aria-hidden="true" />}
      {meters.isError && (
        <p role="alert">
          No se pudieron leer los medidores.{' '}
          <button type="button" className="btn" onClick={() => void meters.refetch()}>
            Reintentar
          </button>
        </p>
      )}
      {meters.data && <Heatmap meters={meters.data} />}
      <p className="chart-legend">
        Cada casilla es el consumo del día frente al esperado de ese medidor, en puntos porcentuales. Las casillas sin número
        están dentro de ±10 %; la intensidad sube a ±25 % y a ±50 %. Un problema de calidad de datos no se ve aquí porque no cambia el consumo: está en Anomalías IA.
      </p>
    </section>
  )
}

export function Dashboard() {
  const { run, running } = useAnalysis()
  const query = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardData>('/dashboard/summary'),
  })

  return (
    <>
      <div className="page-head">
        <h1>Dashboard</h1>
        <p>Qué está pasando con los medidores y qué mirar primero.</p>
      </div>

      {query.isPending && (
        <div role="status">
          <span className="visually-hidden">Cargando el resumen…</span>
          <div className="skeleton" aria-hidden="true" />
        </div>
      )}

      {query.isError && (
        <div className="panel state" role="alert">
          <h2>No se pudo leer el resumen</h2>
          <p>El servidor no respondió como se esperaba. Reintenta o revisa que esté arriba.</p>
          <button type="button" className="btn" onClick={() => void query.refetch()}>
            Reintentar
          </button>
        </div>
      )}

      {query.data && !query.data.has_analysis && (
        <div className="panel state">
          <h2>Aún no hay análisis</h2>
          <p>Ejecuta uno para ver qué medidores se salen de su banda y cuáles conviene revisar primero.</p>
          <button type="button" className="btn btn-primary" onClick={run}>
            {running ? 'Análisis en curso' : 'Ejecutar análisis'}
          </button>
        </div>
      )}

      {query.data?.has_analysis && (
        <>
          <Kpis data={query.data} />
          <div className="dash-grid">
            <Attention items={query.data.attention} />
            <section className="panel" aria-labelledby="plant-title">
              <h2 id="plant-title">Consumo diario de la planta</h2>
              <DailyBars daily={query.data.period.daily} />
              <p className="chart-legend">
                Las dos últimas barras, resaltadas, son las que se comparan con lo esperado para calcular la variación.
              </p>
            </section>
          </div>
          <HeatmapPanel />
        </>
      )}
    </>
  )
}
