import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Sparkline } from '../components/Sparkline'
import { Chip } from '../components/StatusChip'
import { api } from '../lib/api'
import { formatDateTime } from '../lib/plant'
import { meterKind, meterLabel } from '../lib/status'
import { formatInt, formatSignedPct } from '../lib/format'
import type { Meter, MeterStatus } from '../lib/types'

type SortKey = 'consumption' | 'variation' | 'severity'

const STATUSES: { value: MeterStatus; label: string }[] = [
  { value: 'critical', label: 'Crítico' },
  { value: 'alert', label: 'En alerta' },
  { value: 'ok', label: 'OK' },
]

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'severity', label: 'Estado' },
  { key: 'consumption', label: 'Consumo diario' },
  { key: 'variation', label: 'Variación' },
]

export function Meters() {
  const [params, setParams] = useSearchParams()
  const status = params.get('status')?.split(',').filter(Boolean) ?? []
  const q = params.get('q') ?? ''
  const sort = params.get('sort') as SortKey | null
  const order = params.get('order') ?? 'desc'

  const [search, setSearch] = useState(q)
  useEffect(() => setSearch(q), [q])
  useEffect(() => {
    const id = setTimeout(() => {
      if (search !== q) update({ q: search || null })
    }, 250)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function update(changes: Record<string, string | null>) {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    setParams(next, { replace: true })
  }

  const toggleStatus = (value: string) => {
    const next = status.includes(value) ? status.filter((s) => s !== value) : [...status, value]
    update({ status: next.join(',') || null })
  }

  const sortBy = (key: SortKey) => {
    if (sort !== key) update({ sort: key, order: 'desc' })
    else if (order === 'desc') update({ order: 'asc' })
    else update({ sort: null, order: null })
  }

  const query = useQuery({
    queryKey: ['meters', { status, q, sort, order }],
    queryFn: () => {
      const p = new URLSearchParams()
      if (status.length) p.set('status', status.join(','))
      if (q) p.set('q', q)
      if (sort) {
        p.set('sort', sort)
        p.set('order', order)
      }
      return api.get<Meter[]>(`/meters?${p}`)
    },
    placeholderData: (previous) => previous,
  })

  const filtered = status.length > 0 || q !== ''

  return (
    <>
      <div className="page-head">
        <h1>Medidores</h1>
        <p>Cada medidor frente a su consumo esperado. Ordena por lo que necesites revisar primero.</p>
      </div>

      <div className="toolbar">
        <div className="field toolbar-search">
          <label htmlFor="meter-search">Buscar por código, nombre o ubicación</label>
          <input
            id="meter-search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            maxLength={100}
          />
        </div>
        <div className="toolbar-filters" role="group" aria-label="Filtrar por estado">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              className="filter"
              aria-pressed={status.includes(s.value)}
              onClick={() => toggleStatus(s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {query.isPending && (
        <div role="status">
          <span className="visually-hidden">Cargando los medidores…</span>
          <div className="skeleton" style={{ minHeight: 240 }} aria-hidden="true" />
        </div>
      )}

      {query.isError && (
        <div className="panel state" role="alert">
          <h2>No se pudo leer la lista de medidores</h2>
          <p>El servidor no respondió como se esperaba. Reintenta o revisa que esté arriba.</p>
          <button type="button" className="btn" onClick={() => void query.refetch()}>
            Reintentar
          </button>
        </div>
      )}

      {query.data && query.data.length === 0 && (
        <div className="panel state">
          <h2>Ningún medidor coincide</h2>
          <p>
            {q ? `No hay medidores con «${q}»` : 'No hay medidores'}
            {status.length > 0 && ' en los estados elegidos'}.
          </p>
          {filtered && (
            <button type="button" className="btn" onClick={() => setParams({}, { replace: true })}>
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {query.data && query.data.length > 0 && (
        <div className="panel table-wrap">
          <table className="table">
            <caption className="visually-hidden">
              Medidores con su estado, consumo diario reciente y esperado, variación y consumo de los últimos 14 días
            </caption>
            <thead>
              <tr>
                <th scope="col">Medidor</th>
                {COLUMNS.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={sort === c.key ? (order === 'asc' ? 'ascending' : 'descending') : 'none'}
                    className={c.key === 'severity' ? undefined : 'num'}
                  >
                    <button type="button" className="th-sort" onClick={() => sortBy(c.key)}>
                      {c.label}
                      <span aria-hidden="true" className="sort-mark">
                        {sort === c.key ? (order === 'asc' ? '▲' : '▼') : ''}
                      </span>
                    </button>
                  </th>
                ))}
                <th scope="col" className="num">
                  Esperado
                </th>
                <th scope="col">14 días</th>
                <th scope="col">Última lectura</th>
              </tr>
            </thead>
            <tbody>
              {query.data.map((m) => (
                <tr key={m.meter_id}>
                  <th scope="row" className="cell-meter">
                    <Link to={`/medidores/${m.meter_id}`}>
                      <span className="mono">{m.meter_id}</span> {m.name}
                    </Link>
                    <span className="cell-sub">{m.location}</span>
                  </th>
                  <td>
                    <Chip kind={meterKind(m.status)} label={meterLabel(m.status)} />
                    {m.open_anomalies > 0 && (
                      <span className="cell-sub">
                        {m.open_anomalies} {m.open_anomalies === 1 ? 'anomalía abierta' : 'anomalías abiertas'}
                      </span>
                    )}
                  </td>
                  {m.has_baseline ? (
                    <>
                      <td className="num">{formatInt(m.recent_daily_kwh)} kWh</td>
                      <td className="num">{formatSignedPct(m.variation_pct)}</td>
                      <td className="num">{formatInt(m.baseline_daily_kwh)} kWh</td>
                    </>
                  ) : (
                    <td className="num cell-muted" colSpan={3}>
                      Sin lecturas suficientes para un consumo esperado
                    </td>
                  )}
                  <td>
                    <Sparkline values={m.daily.map((d) => d.kwh)} expected={m.baseline_daily_kwh} status={m.status} />
                  </td>
                  <td className="cell-muted">{m.last_reading_at ? formatDateTime(m.last_reading_at) : 'Sin lecturas'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="table-note" aria-live="polite">
        {query.data &&
          `${query.data.length} ${query.data.length === 1 ? 'medidor' : 'medidores'}${filtered ? ' con los filtros aplicados' : ''}.`}
      </p>
    </>
  )
}
