import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertOctagon, CheckCircle2, Clock, FileSpreadsheet, ListTodo, ShieldCheck, TimerReset } from 'lucide-react'
import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Bar,
  BarChart,
} from 'recharts'
import { useAppData } from '../context/AppDataContext'
import { AsyncState } from '../components/ui/AsyncState'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { StatusBadge, PriorityBadge, WorkloadBadge } from '../components/ui/Badge'
import { AiSummaryCard } from '../components/dashboard/AiSummaryCard'
import { computeMemberWorkloads, computeWeeklyClosedTrend } from '../lib/workload'
import { countByStatus, countByTeam, isOverdue, isDueSoon } from '../lib/stats'
import { exportSummaryXlsx } from '../lib/exporters'
import type { TaskStatus } from '../types'

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: '#94a3b8',
  doing: '#2563eb',
  done: '#10b981',
  blocked: '#f43f5e',
}
const STATUS_ORDER: TaskStatus[] = ['todo', 'doing', 'done', 'blocked']
const STATUS_LABELS: Record<TaskStatus, string> = { todo: 'To Do', doing: 'Doing', done: 'Done', blocked: 'Blocked' }

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return '-'
  const date = new Date(dueDate)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()}`
}

export default function Dashboard() {
  const { teams, members, tasks, loading, error } = useAppData()
  const [recentTeamFilter, setRecentTeamFilter] = useState<string>('all')

  const byStatus = useMemo(() => countByStatus(tasks), [tasks])
  const byTeam = useMemo(() => countByTeam(tasks, teams), [tasks, teams])
  const workloads = useMemo(() => computeMemberWorkloads(members, tasks), [members, tasks])
  const weeklyTrend = useMemo(() => computeWeeklyClosedTrend(tasks), [tasks])
  const overdueCount = useMemo(() => tasks.filter(isOverdue).length, [tasks])
  const dueSoonCount = useMemo(() => tasks.filter((tsk) => isDueSoon(tsk)).length, [tasks])
  const recentTasks = useMemo(() => {
    if (recentTeamFilter !== 'all') {
      return [...tasks]
        .filter((tsk) => tsk.team_id === recentTeamFilter)
        .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
        .slice(0, 5)
    }

    // one row per team — the team's own most recently updated task — so no single team can crowd out the rest
    const latestByTeam = new Map<string, (typeof tasks)[number]>()
    for (const tsk of tasks) {
      const key = tsk.team_id ?? 'unassigned'
      const existing = latestByTeam.get(key)
      if (!existing || tsk.updated_at > existing.updated_at) latestByTeam.set(key, tsk)
    }
    return [...latestByTeam.values()].sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1))
  }, [tasks, recentTeamFilter])
  const teamById = useMemo(() => new Map(teams.map((tm) => [tm.id, tm])), [teams])
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  const donutData = STATUS_ORDER.map((status) => ({ name: STATUS_LABELS[status], value: byStatus[status], status }))

  return (
    <AsyncState loading={loading} error={error}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="งานทั้งหมด" value={tasks.length} icon={ListTodo} tone="neutral" />
          <StatCard label="กำลังดำเนินการ" value={byStatus.doing} icon={Clock} tone="success" />
          <StatCard label="เสร็จแล้ว" value={byStatus.done} icon={CheckCircle2} tone="default" />
          <StatCard label="ใกล้ครบกำหนด" value={dueSoonCount} icon={TimerReset} tone="warning" />
          <StatCard label="เกินกำหนด" value={overdueCount} icon={AlertOctagon} tone="danger" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="สัดส่วนงานตามสถานะ" className="lg:col-span-1">
            <div className="relative">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={donutData} dataKey="value" nameKey="name" cx="50%" cy="42%" innerRadius={50} outerRadius={72} paddingAngle={2}>
                    {donutData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} />
                  <Tooltip formatter={(value, name) => [`${value} งาน`, name]} />
                </PieChart>
              </ResponsiveContainer>
              <div
                className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
                style={{ top: '42%' }}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Total</span>
                <span className="text-2xl font-bold text-slate-900">{tasks.length}</span>
              </div>
            </div>
          </Card>

          <Card title="งานตามทีม">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byTeam} margin={{ left: 0 }}>
                <CartesianGrid vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="team" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip formatter={(value) => [`${value} งาน`, 'จำนวนงาน']} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
            {byTeam.length > 0 && (
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>
                  Max: <span className="font-semibold text-slate-600">{Math.max(...byTeam.map((t) => t.count))}</span>
                </span>
                <span>
                  Min: <span className="font-semibold text-slate-600">{Math.min(...byTeam.map((t) => t.count))}</span>
                </span>
              </div>
            )}
          </Card>

          <Card title="แนวโน้มการปิดงาน (รายสัปดาห์)">
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={weeklyTrend} margin={{ left: 0, right: 16, top: 8 }}>
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} />
                <YAxis hide allowDecimals={false} />
                <Tooltip formatter={(value) => [`${value} งาน`, 'ปิดสะสม']} />
                <Line type="monotone" dataKey="closed" stroke="#2563eb" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                {weeklyTrend.length > 0 && (
                  <ReferenceDot
                    x={weeklyTrend[weeklyTrend.length - 1].week}
                    y={weeklyTrend[weeklyTrend.length - 1].closed}
                    r={5}
                    fill="#2563eb"
                    stroke="#fff"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card
            title="งานล่าสุด"
            className="lg:col-span-2"
            action={
              <div className="flex items-center gap-2">
                <select
                  value={recentTeamFilter}
                  onChange={(e) => setRecentTeamFilter(e.target.value)}
                  className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 outline-none focus:border-blue-400"
                >
                  <option value="all">ทุกทีม</option>
                  {teams.map((tm) => (
                    <option key={tm.id} value={tm.id}>
                      {tm.name}
                    </option>
                  ))}
                </select>
                <Link to="/tasks" className="text-xs font-medium text-blue-600 hover:underline">
                  View All
                </Link>
              </div>
            }
          >
            {recentTeamFilter === 'all' && (
              <p className="mb-3 text-xs text-slate-400">แสดงงานล่าสุด 1 รายการต่อทีม เพื่อให้เห็นภาพรวมทุกทีมพร้อมกัน</p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-400">
                    <th className="rounded-l-md py-2 pl-3 font-medium">Task</th>
                    <th className="py-2 font-medium">Team</th>
                    <th className="py-2 font-medium">Owner</th>
                    <th className="py-2 font-medium">Status</th>
                    <th className="py-2 font-medium">Priority</th>
                    <th className="py-2 font-medium">Due Date</th>
                    <th className="rounded-r-md py-2 pr-3 font-medium">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map((tsk) => (
                    <tr key={tsk.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 pl-3 font-medium text-slate-700">{tsk.title}</td>
                      <td className="py-2.5 text-slate-500">{teamById.get(tsk.team_id ?? '')?.name ?? '-'}</td>
                      <td className="py-2.5 text-slate-500">{memberById.get(tsk.owner_id ?? '')?.name ?? '-'}</td>
                      <td className="py-2.5"><StatusBadge status={tsk.status} /></td>
                      <td className="py-2.5"><PriorityBadge priority={tsk.priority} /></td>
                      <td className={`py-2.5 ${isOverdue(tsk) ? 'font-medium text-rose-600' : 'text-slate-500'}`}>
                        {formatDueDate(tsk.due_date)}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-500">{tsk.progress}%</td>
                    </tr>
                  ))}
                  {recentTasks.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        {recentTeamFilter === 'all'
                          ? 'ยังไม่มีข้อมูลงาน — ลองเพิ่มงานที่หน้า Admin'
                          : 'ไม่พบงานของทีมนี้'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card
            title="AI Team Workload"
            action={
              <Link to="/workload" className="text-xs font-medium text-blue-600 hover:underline">
                Details
              </Link>
            }
          >
            <div className="space-y-2.5">
              {workloads.slice(0, 3).map((w) => (
                <div key={w.member.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-slate-800">{w.member.name}</p>
                    <WorkloadBadge level={w.level} />
                  </div>
                  <p className="text-xs text-slate-500">
                    Tasks: <span className="font-medium text-slate-700">{w.openTaskCount} left</span>
                    <span className="mx-1.5 text-slate-300">|</span>
                    Effort: <span className="font-medium text-slate-700">{w.totalEffortDays} days</span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-400">{w.reason}</p>
                </div>
              ))}
              {workloads.length === 0 && <p className="text-sm text-slate-400">ยังไม่มีสมาชิกในทีม</p>}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="จัดการข้อมูล">
            <div className="flex flex-col gap-2.5">
              <p className="text-sm text-slate-500">
                จัดการทีมได้ที่หน้า Admin ส่วนงานและสมาชิกจัดการได้ในหน้ารายละเอียดของแต่ละทีม
              </p>
              <Link
                to="/admin"
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                <ShieldCheck size={16} />
                ไปที่หน้า Admin
              </Link>
            </div>
          </Card>

          <AiSummaryCard tasks={tasks} workloads={workloads} />

          <Card title="Export Results">
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => exportSummaryXlsx(tasks, teams, members, workloads)}
                disabled={tasks.length === 0}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <FileSpreadsheet size={16} />
                Export Summary (Excel)
              </button>
            </div>
          </Card>
        </div>
      </div>
    </AsyncState>
  )
}
