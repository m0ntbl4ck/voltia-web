const number = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0, useGrouping: true })
const signed = new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
  signDisplay: 'always',
})

export const formatInt = (n: number) => number.format(n)
export const formatSignedPct = (n: number) => `${signed.format(n)} %`
export const formatPct = (ratio: number) => `${number.format(ratio * 100)} %`

const day = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', timeZone: 'UTC' })
export const formatDay = (iso: string) => day.format(new Date(iso))
