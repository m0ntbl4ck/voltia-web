// The API sends UTC and the baseline profile is indexed by the plant's local hour.
// The API does not expose the plant zone, so it is fixed here to match PLANT_TZ in the backend.
export const PLANT_TZ = 'America/Bogota'

const parts = new Intl.DateTimeFormat('en-CA', {
  timeZone: PLANT_TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

function wall(ms: number) {
  const p = Object.fromEntries(parts.formatToParts(ms).map((x) => [x.type, Number(x.value)]))
  return { year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute, second: p.second }
}

/** Hour of day (0 to 23) in the plant zone. */
export const plantHour = (iso: string) => wall(Date.parse(iso)).hour

/** Local date in the plant zone as YYYY-MM-DD. */
export function plantDate(iso: string) {
  const w = wall(Date.parse(iso))
  return `${w.year}-${String(w.month).padStart(2, '0')}-${String(w.day).padStart(2, '0')}`
}

/** The plant's wall clock read as if it were UTC, so a chart in UTC mode shows plant time. */
export function plantWallMs(iso: string) {
  const w = wall(Date.parse(iso))
  return Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute, w.second)
}

const dateTime = new Intl.DateTimeFormat('es-CO', {
  timeZone: PLANT_TZ,
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso))
