import { useQuery } from '@tanstack/react-query'
import { RunView } from '../components/Analysis'
import { api, ApiError } from '../lib/api'
import { useAnalysis } from '../lib/use-analysis'
import type { Run } from '../lib/types'

const STAGES: [string, string][] = [
  ['Lecturas', 'Carga las lecturas de cada medidor.'],
  ['Baseline', 'Aprende cómo se comporta cada medidor en cada hora del día.'],
  ['Detección', 'Busca lecturas fuera de esa banda con los detectores.'],
  ['Correlación', 'Agrupa las señales que van juntas en un episodio.'],
  ['Eventos', 'Cruza cada episodio con los eventos reportados.'],
  ['Explicación', 'Redacta lo que encontró a partir de la evidencia.'],
  ['Recomendación', 'Guarda cada anomalía con su acción recomendada.'],
]

const when = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Bogota',
})

export function AnalysisPage() {
  const { run, running } = useAnalysis()
  const latest = useQuery({
    queryKey: ['analysis', 'latest'],
    queryFn: () => api.get<Run>('/ai/analysis/latest'),
    retry: false,
  })
  const none = latest.error instanceof ApiError && latest.error.status === 404
  const seconds =
    latest.data?.finished_at !== undefined && latest.data.finished_at !== null
      ? (Date.parse(latest.data.finished_at) - Date.parse(latest.data.started_at)) / 1000
      : null

  return (
    <>
      <div className="page-head">
        <h1>Análisis</h1>
        <p>Cada ejecución recorre siete etapas y deja las anomalías listas para investigar.</p>
      </div>

      <div className="dash-grid">
        <section className="panel" aria-labelledby="last-title">
          <div className="section-head">
            <h2 id="last-title">Último análisis</h2>
            <button type="button" className="btn btn-primary" onClick={run}>
              {running ? 'Análisis en curso' : 'Ejecutar análisis'}
            </button>
          </div>

          {latest.isPending && (
            <div role="status">
              <span className="visually-hidden">Cargando el último análisis…</span>
              <div className="skeleton" style={{ minHeight: 240 }} aria-hidden="true" />
            </div>
          )}
          {none && <p className="cell-muted">Aún no se ha ejecutado ningún análisis. Ejecuta uno para verlo aquí.</p>}
          {latest.isError && !none && (
            <div className="state" role="alert">
              <p>No se pudo leer el último análisis. Reintenta o revisa que el servidor esté arriba.</p>
              <button type="button" className="btn" onClick={() => void latest.refetch()}>
                Reintentar
              </button>
            </div>
          )}
          {latest.data && (
            <div className="run">
              <p className="cell-sub">
                Empezó el {when.format(new Date(latest.data.started_at))}
                {seconds !== null && ` y tardó ${seconds.toFixed(1).replace('.', ',')} s`}.
              </p>
              <RunView run={latest.data} />
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="stages-title">
          <h2 id="stages-title">Qué hace cada etapa</h2>
          <dl className="stage-help">
            {STAGES.map(([name, text]) => (
              <div key={name}>
                <dt>{name}</dt>
                <dd>{text}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </>
  )
}
