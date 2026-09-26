import { useQuery } from '@tanstack/react-query'
import { useAnalysis } from '../lib/use-analysis'
import { api } from '../lib/api'
import { formatDay, formatInt, formatPct, formatSignedPct } from '../lib/format'
import type { Dashboard as DashboardData } from '../lib/types'

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

      {query.data?.has_analysis && <Kpis data={query.data} />}
    </>
  )
}
