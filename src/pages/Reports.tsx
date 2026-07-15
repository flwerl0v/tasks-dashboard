import { useMemo } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppData } from '../context/AppDataContext'
import { AsyncState } from '../components/ui/AsyncState'
import { Card } from '../components/ui/Card'
import { computeWeeklyClosedTrend } from '../lib/workload'
import { isOverdue } from '../lib/stats'
import type { TaskPriority } from '../types'

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#94a3b8',
  medium: '#f59e0b',
  high: '#f43f5e',
  critical: '#be123c',
}
const PRIORITY_LABELS: Record<TaskPriority, string> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }

export default function Reports() {
  const { teams, tasks, loading, error } = useAppData()

  const teamCompletion = useMemo(
    () =>
      teams.map((team) => {
        const teamTasks = tasks.filter((tsk) => tsk.team_id === team.id)
        return {
          team: team.name,
          เสร็จแล้ว: teamTasks.filter((tsk) => tsk.status === 'done').length,
          ค้างอยู่: teamTasks.filter((tsk) => tsk.status !== 'done').length,
        }
      }),
    [teams, tasks],
  )

  const priorityData = useMemo(
    () =>
      (['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((priority) => ({
        priority,
        label: PRIORITY_LABELS[priority],
        count: tasks.filter((tsk) => tsk.priority === priority).length,
      })),
    [tasks],
  )

  const weeklyTrend = useMemo(() => computeWeeklyClosedTrend(tasks, 8), [tasks])
  const overdueCount = useMemo(() => tasks.filter(isOverdue).length, [tasks])
  const avgProgress = useMemo(
    () => (tasks.length > 0 ? Math.round(tasks.reduce((sum, tsk) => sum + tsk.progress, 0) / tasks.length) : 0),
    [tasks],
  )

  return (
    <AsyncState loading={loading} error={error}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <p className="text-xs text-slate-500">งานทั้งหมด</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{tasks.length}</p>
          </Card>
          <Card>
            <p className="text-xs text-slate-500">ความคืบหน้าเฉลี่ย</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{avgProgress}%</p>
          </Card>
          <Card>
            <p className="text-xs text-slate-500">งานเกินกำหนด</p>
            <p className="mt-1 text-2xl font-bold text-rose-600">{overdueCount}</p>
          </Card>
          <Card>
            <p className="text-xs text-slate-500">จำนวนทีม</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{teams.length}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="สถานะงานเสร็จ vs ค้างอยู่ ต่อทีม">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={teamCompletion} margin={{ left: -20 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="team" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="เสร็จแล้ว" stackId="s" fill="#10b981" radius={[0, 0, 0, 0]} maxBarSize={40} />
                <Bar dataKey="ค้างอยู่" stackId="s" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card title="งานตามระดับความสำคัญ (Priority)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={priorityData} margin={{ left: -20 }}>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(value) => [`${value} งาน`, 'จำนวนงาน']} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card title="แนวโน้มการปิดงานสะสม (8 สัปดาห์ล่าสุด)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyTrend} margin={{ left: -20 }}>
              <CartesianGrid vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip formatter={(value) => [`${value} งาน`, 'ปิดสะสม']} />
              <Line type="monotone" dataKey="closed" stroke="#2563eb" strokeWidth={2} dot={{ r: 4, fill: '#2563eb' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </AsyncState>
  )
}
