import type { RefObject } from 'react'
import { Line, LineChart, ReferenceDot, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { chartColors } from '../../lib/colors'
import type { WeeklyTrendPoint } from '../../types'

interface WeeklyTrendChartProps {
  data: WeeklyTrendPoint[]
  chartRef?: RefObject<HTMLDivElement | null>
}

/** Cumulative weekly closed-task trend line — shared by Dashboard (live) and Export (chart-capture source). */
export function WeeklyTrendChart({ data, chartRef }: WeeklyTrendChartProps) {
  return (
    <div ref={chartRef}>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ left: 0, right: 16, top: 8 }}>
          <XAxis dataKey="week" tick={{ fontSize: 12, fill: chartColors.tick }} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
          <YAxis hide allowDecimals={false} />
          <Tooltip formatter={(value) => [`${value} งาน`, 'ปิดสะสม']} />
          <Line type="monotone" dataKey="closed" stroke={chartColors.brand} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
          {data.length > 0 && (
            <ReferenceDot
              x={data[data.length - 1].week}
              y={data[data.length - 1].closed}
              r={5}
              fill={chartColors.brand}
              stroke="#fff"
              strokeWidth={2}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
