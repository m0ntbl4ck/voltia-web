import { LineChart } from 'echarts/charts'
import { GridComponent, MarkAreaComponent, MarkLineComponent, TooltipComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { useEffect, useMemo, useRef } from 'react'
import { formatDecimal } from '../lib/format'
import { plantHour, plantWallMs } from '../lib/plant'
import { useTheme } from '../lib/use-theme'
import type { Baseline, MeterAnomaly, MeterEvent, Point, VariableKey } from '../lib/types'
import { VARIABLES } from '../lib/series'
import { anomalyKind, type ChipKind } from '../lib/status'

echarts.use([LineChart, GridComponent, TooltipComponent, MarkAreaComponent, MarkLineComponent, CanvasRenderer])

const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const KIND_VAR: Record<ChipKind, string> = {
  critical: '--critical',
  alert: '--alert',
  ok: '--ok',
  'data-quality': '--data-quality',
  'false-positive': '--false-positive',
}

interface Props {
  points: Point[]
  baseline: Baseline | null
  variable: VariableKey
  anomalies: MeterAnomaly[]
  events: MeterEvent[]
}

export function SeriesChart({ points, baseline, variable, anomalies, events }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts | null>(null)
  const { theme } = useTheme()
  const meta = VARIABLES.find((v) => v.key === variable)!

  const data = useMemo(() => {
    const profile = baseline?.profile[variable]
    return points.map((p) => {
      const b = profile?.[plantHour(p.timestamp)]
      const half = b && baseline ? baseline.band_z * b.sigma : null
      return {
        t: plantWallMs(p.timestamp),
        v: p[variable],
        lo: b && half !== null ? b.median - half : null,
        hi: b && half !== null ? b.median + half : null,
      }
    })
  }, [points, baseline, variable])

  useEffect(() => {
    if (!el.current) return
    chart.current = echarts.init(el.current, undefined, { renderer: 'canvas' })
    const observer = new ResizeObserver(() => chart.current?.resize())
    observer.observe(el.current)
    return () => {
      observer.disconnect()
      chart.current?.dispose()
      chart.current = null
    }
  }, [])

  useEffect(() => {
    if (!chart.current) return
    const text = css('--text')
    const muted = css('--text-muted')
    const border = css('--border')
    const hasBand = data.some((d) => d.lo !== null)

    chart.current.setOption(
      {
        animation: false,
        useUTC: true,
        textStyle: { fontFamily: css('--font-sans') },
        grid: { left: 56, right: 16, top: 16, bottom: 32 },
        tooltip: {
          trigger: 'axis',
          confine: true,
          backgroundColor: css('--raised'),
          borderColor: border,
          textStyle: { color: text, fontSize: 12 },
          formatter: (params: { dataIndex: number }[]) => {
            const d = data[params[0].dataIndex]
            const when = new Date(d.t).toLocaleString('es-CO', {
              timeZone: 'UTC',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
              hourCycle: 'h23',
            })
            const unit = meta.unit ? ` ${meta.unit}` : ''
            const band =
              d.lo !== null && d.hi !== null
                ? `<br/>Esperado: ${formatDecimal(d.lo, meta.digits)} a ${formatDecimal(d.hi, meta.digits)}${unit}<br/>${d.v < d.lo || d.v > d.hi ? 'Fuera de la banda' : 'Dentro de la banda'}`
                : ''
            return `${when}<br/><b>${formatDecimal(d.v, meta.digits)}${unit}</b>${band}`
          },
        },
        xAxis: {
          type: 'time',
          axisLine: { lineStyle: { color: border } },
          axisLabel: { color: muted },
          splitLine: { show: false },
        },
        yAxis: {
          type: 'value',
          scale: true,
          axisLabel: { color: muted, formatter: (v: number) => formatDecimal(v, variable === 'power_factor' ? 2 : 0) },
          splitLine: { lineStyle: { color: border } },
        },
        series: [
          ...(hasBand
            ? [
                {
                  name: 'base',
                  type: 'line',
                  stack: 'band',
                  silent: true,
                  symbol: 'none',
                  lineStyle: { opacity: 0 },
                  tooltip: { show: false },
                  data: data.map((d) => [d.t, d.lo]),
                },
                {
                  name: 'banda',
                  type: 'line',
                  stack: 'band',
                  silent: true,
                  symbol: 'none',
                  lineStyle: { opacity: 0 },
                  areaStyle: { color: muted, opacity: 0.22 },
                  tooltip: { show: false },
                  data: data.map((d) => [d.t, d.lo === null || d.hi === null ? null : d.hi - d.lo]),
                },
              ]
            : []),
          {
            name: meta.label,
            type: 'line',
            symbol: 'none',
            lineStyle: { color: text, width: 1.5 },
            itemStyle: { color: text },
            data: data.map((d) => [d.t, d.v]),
            markArea: {
              silent: true,
              data: anomalies.map((a) => [
                { xAxis: plantWallMs(a.episode_start), itemStyle: { color: css(KIND_VAR[anomalyKind(a.type, a.severity)]), opacity: 0.2 } },
                { xAxis: plantWallMs(a.episode_end) },
              ]),
            },
            markLine: {
              silent: true,
              symbol: 'none',
              lineStyle: { color: muted, type: 'dashed' },
              label: { color: muted, formatter: 'Evento', position: 'insideEndTop' },
              data: events.map((e) => ({ xAxis: plantWallMs(e.timestamp) })),
            },
          },
        ],
      },
      true,
    )
  }, [data, theme, meta, variable, anomalies, events])

  return <div ref={el} className="chart" />
}
