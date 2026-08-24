import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useAppData } from '../context/AppDataContext'
import { AsyncState } from '../components/ui/AsyncState'
import { Card } from '../components/ui/Card'
import { Avatar } from '../components/ui/Avatar'
import { EmptyState } from '../components/ui/EmptyState'
import { WeeklyTrendChart } from '../components/charts/WeeklyTrendChart'
import { computeMemberWorkloads, computeTeamWorkloadSummary, computeWeeklyClosedTrend } from '../lib/workload'
import { countByStatus, countByTeamAndStatus, isOverdue } from '../lib/stats'
import { PRIORITY_COLORS, STATUS_COLORS, chartColors } from '../lib/colors'
import type { TaskPriority, TaskStatus } from '../types'

const PRIORITY_LABELS: Record<TaskPriority, string> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }
const STATUS_ORDER: TaskStatus[] = ['todo', 'doing', 'done', 'blocked']
const STATUS_LABELS: Record<TaskStatus, string> = { todo: 'To Do', doing: 'Doing', done: 'Done', blocked: 'Blocked' }

interface TeamStatusTooltipProps {
  active?: boolean
  label?: string
  payload?: Array<{ dataKey: TaskStatus; name?: string; value: number; color: string }>
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
              {p.name ?? STATUS_LABELS[p.dataKey]}
            </span>
            <span className="font-semibold tabular-nums text-ink-900">{p.value} งาน</span>
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

interface PriorityTooltipProps {
  active?: boolean
  payload?: Array<{ value: number; payload: { label: string; priority: TaskPriority } }>
}

function PriorityTooltip({ active, payload }: PriorityTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const item = payload[0]
  return (
    <div className="min-w-[120px] rounded-lg border border-border bg-surface px-3 py-2.5 shadow-lg">
      <div className="flex items-center justify-between gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-ink-500">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[item.payload.priority] }} />
          {item.payload.label}
        </span>
        <span className="font-semibold tabular-nums text-ink-900">{item.value} งาน</span>
      </div>
    </div>
  )
}

export default function Reports() {
  const { teams, members, tasks, loading, error } = useAppData()

  const byStatus = useMemo(() => countByStatus(tasks), [tasks])
  const donutData = STATUS_ORDER.map((status) => ({ name: STATUS_LABELS[status], value: byStatus[status], status }))

  const workloads = useMemo(() => computeMemberWorkloads(members, tasks), [members, tasks])
  const teamWorkloadSummary = useMemo(() => computeTeamWorkloadSummary(teams, workloads), [teams, workloads])
  const avgLoadScore = useMemo(
    () => (workloads.length > 0 ? Math.round(workloads.reduce((sum, w) => sum + w.loadScore, 0) / workloads.length) : 0),
    [workloads],
  )

  const topOverdueOwners = useMemo(() => {
    const memberById = new Map(members.map((m) => [m.id, m]))
    const counts = new Map<string, number>()
    for (const tsk of tasks) {
      if (!tsk.owner_id || !isOverdue(tsk)) continue
      counts.set(tsk.owner_id, (counts.get(tsk.owner_id) ?? 0) + 1)
    }
    return [...counts.entries()]
      .map(([ownerId, count]) => ({ member: memberById.get(ownerId), count }))
      .filter((row): row is { member: NonNullable<typeof row.member>; count: number } => Boolean(row.member))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
  }, [tasks, members])

  const byTeamStatus = useMemo(() => countByTeamAndStatus(tasks, teams), [tasks, teams])

  const priorityData = useMemo(
    () =>
      (['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((priority) => ({
        priority,
        label: PRIORITY_LABELS[priority],
        count: tasks.filter((tsk) => tsk.priority === priority).length,
      })),
    [tasks],
  )

  const weeklyTrend = useMemo(() => computeWeeklyClosedTrend(tasks), [tasks])
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
            <p className="text-xs text-ink-500">งานทั้งหมด</p>
            <p className="mt-1 text-2xl font-bold text-ink-900">{tasks.length}</p>
          </Card>
          <Card>
            <p className="text-xs text-ink-500">ความคืบหน้าเฉลี่ย</p>
            <p className="mt-1 text-2xl font-bold text-ink-900">{avgProgress}%</p>
          </Card>
          <Card>
            <p className="text-xs text-ink-500">งานเกินกำหนด</p>
            <p className="mt-1 text-2xl font-bold text-danger-600">{overdueCount}</p>
          </Card>
          <Card>
            <p className="text-xs text-ink-500">จำนวนทีม</p>
            <p className="mt-1 text-2xl font-bold text-ink-900">{teams.length}</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card title="งานตามทีม">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byTeamStatus} margin={{ left: 0 }} barGap={3} barCategoryGap="20%">
                <CartesianGrid vertical={false} stroke={chartColors.grid} />
                <XAxis dataKey="team" tick={{ fontSize: 12, fill: chartColors.tick }} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip content={<TeamStatusTooltip />} cursor={{ fill: chartColors.cursor }} />
                {STATUS_ORDER.map((status) => (
                  <Bar key={status} dataKey={status} name={STATUS_LABELS[status]} fill={STATUS_COLORS[status]} radius={[4, 4, 0, 0]} maxBarSize={24} />
                ))}
              </BarChart>
            </ResponsiveContainer>
            {byTeamStatus.length > 0 && <TeamStatusLegend />}
          </Card>

          <Card title="งานตามระดับความสำคัญ (Priority)">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={priorityData} margin={{ left: 0 }}>
                <CartesianGrid vertical={false} stroke={chartColors.grid} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: chartColors.tick }} axisLine={{ stroke: chartColors.grid }} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip content={<PriorityTooltip />} cursor={{ fill: chartColors.cursor }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={32}>
                  {priorityData.map((entry) => (
                    <Cell key={entry.priority} fill={PRIORITY_COLORS[entry.priority]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card title="แนวโน้มการปิดงาน (รายสัปดาห์)">
          <WeeklyTrendChart data={weeklyTrend} />
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="สัดส่วนงานทั้งบริษัท">
            <div className="flex flex-col items-center gap-5">
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
                  <span className="text-3xl font-bold text-ink-900">{tasks.length}</span>
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
          </Card>

          <Card
            title="สรุปภาระงานทีม (Workload)"
            action={
              <Link to="/workload" className="text-xs font-medium text-primary-600 hover:underline">
                Details
              </Link>
            }
          >
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="text-danger-600">เยอะเกิน {workloads.filter((w) => w.level === 'overload').length}</span>
              <span className="text-success-600">พอดี {workloads.filter((w) => w.level === 'balanced').length}</span>
              <span className="text-warning-600">น้อยเกิน {workloads.filter((w) => w.level === 'underload').length}</span>
              <span className="ml-auto font-semibold text-ink-700">เฉลี่ยรวม {avgLoadScore}%</span>
            </div>
            <div className="space-y-2">
              {teamWorkloadSummary.map((s) => (
                <div key={s.team.id} className="flex items-center justify-between rounded-lg border border-border-100 px-3 py-2 text-sm">
                  <span className="font-medium text-ink-700">{s.team.name}</span>
                  <span className="text-xs text-ink-400">{s.memberCount} คน · เฉลี่ย {s.avgLoadScore}%</span>
                </div>
              ))}
              {teamWorkloadSummary.length === 0 && <p className="text-sm text-ink-400">ยังไม่มีทีมในระบบ</p>}
            </div>
          </Card>

          <Card title="Top ผู้รับผิดชอบที่งานเกินกำหนดมากที่สุด">
            {topOverdueOwners.length === 0 ? (
              <EmptyState py="md">ไม่มีงานเกินกำหนดในขณะนี้</EmptyState>
            ) : (
              <div className="space-y-2.5">
                {topOverdueOwners.map(({ member, count }) => (
                  <div key={member.id} className="flex items-center justify-between gap-2 rounded-lg border border-border-100 px-3 py-2 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar id={member.id} name={member.name} size={24} />
                      <span className="truncate font-medium text-ink-700">{member.name}</span>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-danger-600">{count} งาน</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AsyncState>
  )
}
