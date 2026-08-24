import type { RefObject } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { STATUS_COLORS, STATUS_LABELS, STATUS_ORDER, chartColors } from '../../lib/colors'
import type { TeamStatusBreakdown } from '../../lib/stats'
import type { TaskStatus } from '../../types'

interface TeamStatusTooltipProps {
  active?: boolean
  label?: string
  payload?: Array<{ dataKey: TaskStatus; value: number; color: string }>
}

function TeamStatusTooltip({ active, label, payload }: TeamStatusTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const rows = payload.filter((p) => p.value > 0)
  if (rows.length === 0) return null
  return (
    <div className="min-w-[140px] rounded-lg border border-border bg-surface px-3 py-2.5 shadow-lg">
      <p className="mb-1.5 text-xs font-semibold text-ink-800">{label}</p>
      <div className="space-y-1">
        {rows.map((p) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-ink-500">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
              {STATUS_LABELS[p.dataKey]}
            </span>
            <span className="font-semibold tabular-nums text-ink-900">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TeamStatusLegend() {
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-border-100 pt-3">
      {STATUS_ORDER.map((status) => (
        <div key={status} className="flex items-center gap-1.5 text-xs text-ink-500">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
          {STATUS_LABELS[status]}
        </div>
      ))}
    </div>
  )
}

interface TeamStatusBarChartProps {
  data: TeamStatusBreakdown[]
  chartRef?: RefObject<HTMLDivElement | null>
}

/** Per-team status breakdown bar chart — shared by Dashboard (live) and Export (chart-capture source). */
export function TeamStatusBarChart({ data, chartRef }: TeamStatusBarChartProps) {
  return (
    <div ref={chartRef}>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ left: 0 }} barGap={3} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke={chartColors.grid} />
          <XAxis dataKey="team" tick={{ fontSize: 12, fill: chartColors.tick }} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
          <YAxis hide allowDecimals={false} />
          <Tooltip content={<TeamStatusTooltip />} cursor={{ fill: chartColors.cursor }} />
          {STATUS_ORDER.map((status) => (
            <Bar key={status} dataKey={status} name={STATUS_LABELS[status]} fill={STATUS_COLORS[status]} radius={[4, 4, 0, 0]} maxBarSize={24} />
          ))}
        </BarChart>
      </ResponsiveContainer>
      {data.length > 0 && <TeamStatusLegend />}
    </div>
  )
}
