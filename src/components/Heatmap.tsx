import { Link } from 'react-router'
import { formatDay, formatInt, formatSignedPct } from '../lib/format'
import { tier } from '../lib/series'
import type { Meter } from '../lib/types'

/** Each cell is the meter's day against its own expected daily consumption. */
export function Heatmap({ meters }: { meters: Meter[] }) {
  const rows = meters.filter((m) => m.has_baseline && m.baseline_daily_kwh > 0 && m.daily.length > 0)
  if (rows.length === 0) return null
  const days = rows[0].daily.map((d) => d.date)

  return (
    <div className="table-wrap plain">
      <table className="heat">
        <caption className="visually-hidden">
          Desviación del consumo diario de cada medidor frente a lo esperado, por día
        </caption>
        <thead>
          <tr>
            <th scope="col">Medidor</th>
            {days.map((d) => (
              <th key={d} scope="col" className="heat-day">
                {new Date(d).getUTCDate()}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.meter_id}>
              <th scope="row">
                <Link to={`/medidores/${m.meter_id}`}>
                  <span className="mono">{m.meter_id}</span> {m.name}
                </Link>
              </th>
              {m.daily.map((d) => {
                const dev = ((d.kwh - m.baseline_daily_kwh) / m.baseline_daily_kwh) * 100
                const t = tier(dev)
                return (
                  <td
                    key={d.date}
                    className="heat-cell"
                    data-tier={t}
                    title={`${m.meter_id}, ${formatDay(d.date)}: ${formatInt(d.kwh)} kWh, ${formatSignedPct(dev)} frente a lo esperado`}
                  >
                    {t > 0 ? `${dev > 0 ? '+' : '−'}${Math.round(Math.abs(dev))}` : ''}
                    <span className="visually-hidden">
                      {formatInt(d.kwh)} kWh, {formatSignedPct(dev)}
                    </span>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
