const number = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0, useGrouping: true })
const signed = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'always',
})

export const formatInt = (n: number) => number.format(n)
// A change that rounds to zero carries no sign.
export const formatSignedPct = (n: number) =>
  Math.abs(n) < 0.05 ? '0,0\u00a0%' : `${signed.format(n)}\u00a0%`
export const formatPct = (ratio: number) => `${number.format(ratio * 100)}\u00a0%`

const day = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' })
export const formatDay = (iso: string) => day.format(new Date(iso))

export const formatDecimal = (n: number, digits: number) =>
  new Intl.NumberFormat('es-CO', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n)
