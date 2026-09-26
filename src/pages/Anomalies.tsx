import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router'
import { Chip } from '../components/StatusChip'
import { api } from '../lib/api'
import { formatPct } from '../lib/format'
import { ACTION_LABEL, anomalyKind, SEVERITY_LABEL, STATUS_LABEL, TYPE_LABEL } from '../lib/status'
import type { Anomaly } from '../lib/types'

const FILTERS = [
  { name: 'type', label: 'Tipo', options: TYPE_LABEL },
  { name: 'severity', label: 'Severidad', options: SEVERITY_LABEL },
  { name: 'status', label: 'Estado', options: STATUS_LABEL },
] as const

export function Anomalies() {
  const [params, setParams] = useSearchParams()

  const query = useQuery({
    queryKey: ['anomalies', params.toString()],
    queryFn: () => api.get<Anomaly[]>(`/anomalies?${params}`),
    placeholderData: (previous) => previous,
  })

  const set = (name: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    setParams(next, { replace: true })
  }
  const filtered = params.size > 0

  return (
    <>
      <div className="page-head">
        <h1>Anomalías IA</h1>
        <p>Ordenadas por prioridad, de la que más urge a la que menos.</p>
      </div>

      <div className="toolbar">
        {FILTERS.map((f) => (
          <div className="field" key={f.name}>
            <label htmlFor={`f-${f.name}`}>{f.label}</label>
            <select id={`f-${f.name}`} value={params.get(f.name) ?? ''} onChange={(e) => set(f.name, e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(f.options).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ))}
        {filtered && (
          <button type="button" className="btn" onClick={() => setParams({}, { replace: true })}>
            Limpiar filtros
          </button>
        )}
      </div>

      {query.isPending && (
        <div role="status">
          <span className="visually-hidden">Cargando las anomalías…</span>
          <div className="skeleton" style={{ minHeight: 200 }} aria-hidden="true" />
        </div>
      )}

      {query.isError && (
        <div className="panel state" role="alert">
          <h2>No se pudo leer la lista de anomalías</h2>
          <p>El servidor no respondió como se esperaba. Reintenta o revisa que esté arriba.</p>
          <button type="button" className="btn" onClick={() => void query.refetch()}>
            Reintentar
          </button>
        </div>
      )}

      {query.data && query.data.length === 0 && (
        <div className="panel state">
          <h2>{filtered ? 'Ninguna anomalía coincide' : 'Aún no hay anomalías'}</h2>
          <p>
            {filtered
              ? 'Cambia o limpia los filtros para ver el resto.'
              : 'Ejecuta un análisis desde el botón de arriba para que aparezcan las que se salen de su banda.'}
          </p>
        </div>
      )}

      {query.data && query.data.length > 0 && (
        <div className="panel table-wrap">
          <table className="table">
            <caption className="visually-hidden">
              Anomalías con su prioridad, tipo, severidad, confianza y la acción recomendada
            </caption>
            <thead>
              <tr>
                <th scope="col" className="num">
                  Prioridad
                </th>
                <th scope="col">Anomalía</th>
                <th scope="col">Tipo</th>
                <th scope="col">Severidad</th>
                <th scope="col" className="num">
                  Confianza
                </th>
                <th scope="col">Acción recomendada</th>
                <th scope="col">Estado</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((a) => (
                <tr key={a.id}>
                  <td className="num prio">{a.priority}</td>
                  <th scope="row" className="cell-meter">
                    <Link to={`/anomalias/${a.id}`}>
                      <span className="mono">{a.meter_id}</span> {a.meter_name}
                    </Link>
                    <span className="cell-sub">{a.anomaly}</span>
                  </th>
                  <td>
                    <Chip kind={anomalyKind(a.type, a.severity)} label={TYPE_LABEL[a.type]} />
                  </td>
                  <td>{SEVERITY_LABEL[a.severity]}</td>
                  <td className="num">{formatPct(a.confidence)}</td>
                  <td>{a.recommended_next_action ? ACTION_LABEL[a.recommended_next_action] : 'Sin acción pendiente'}</td>
                  <td className="cell-muted">{STATUS_LABEL[a.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
