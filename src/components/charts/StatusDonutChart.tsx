import type { RefObject } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { STATUS_COLORS, STATUS_LABELS, STATUS_ORDER } from '../../lib/colors'
import type { TaskStatus } from '../../types'

interface StatusDonutChartProps {
  byStatus: Record<TaskStatus, number>
  total: number
  chartRef?: RefObject<HTMLDivElement | null>
}

/** Company-wide status donut — shared by Dashboard (live) and Export (chart-capture source). */
export function StatusDonutChart({ byStatus, total, chartRef }: StatusDonutChartProps) {
  const donutData = STATUS_ORDER.map((status) => ({ name: STATUS_LABELS[status], value: byStatus[status], status }))

  return (
    <div ref={chartRef} className="flex flex-col items-center gap-5">
      <div className="relative h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={54} outerRadius={82} paddingAngle={2}>
              {donutData.map((entry) => (
                <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [`${value} งาน`, name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-ink-900">{total}</span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-400">งานทั้งหมด</span>
        </div>
      </div>
      <div className="grid w-full grid-cols-4 gap-2">
        {STATUS_ORDER.map((status) => (
          <div key={status} className="flex flex-col items-center gap-1 text-center">
            <span className="flex items-center gap-1.5 text-xs text-ink-500">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: STATUS_COLORS[status] }} />
              {STATUS_LABELS[status]}
            </span>
            <span className="text-base font-bold text-ink-900">{byStatus[status]}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
