import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertOctagon, CheckCircle2, Clock, FileSpreadsheet, ListTodo, ShieldCheck, TimerReset, Info } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { getTeamBadgeStyle } from '../lib/teamColor'
import { AsyncState } from '../components/ui/AsyncState'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { StatusBadge, PriorityFlag, WorkloadBadge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { EmptyState } from '../components/ui/EmptyState'
import { ProgressBar } from '../components/ui/ProgressBar'
import { AiSummaryCard } from '../components/dashboard/AiSummaryCard'
import { StatusDonutChart } from '../components/charts/StatusDonutChart'
import { TeamStatusBarChart } from '../components/charts/TeamStatusBarChart'
import { WeeklyTrendChart } from '../components/charts/WeeklyTrendChart'
import { DropdownSelect } from '../components/ui/DropdownSelect'
import { cancelBtnClass, primaryBtnClass } from '../components/ui/formStyles'
import { Modal } from '../components/ui/Modal'
import { computeMemberWorkloads, computeWeeklyClosedTrend } from '../lib/workload'
import { countByStatus, countByTeamAndStatus, isOverdue, isDueSoon } from '../lib/stats'
import { exportSummaryXlsx } from '../lib/exporters'
import { captureCharts } from '../lib/chartCapture'
import { STATUS_COLORS } from '../lib/colors'
import type { TaskStatus } from '../types'

const STATUS_ROW_BG: Record<TaskStatus, string> = {
  todo: 'bg-primary-50/40',
  doing: 'bg-warning-50/40',
  done: 'bg-success-50/40',
  blocked: 'bg-danger-50/50',
}

function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return '-'
  const date = new Date(dueDate)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()}`
}

export default function Dashboard() {
  const { teams, members, tasks, loading, error } = useAppData()
  const navigate = useNavigate()
  const [confirmAdmin, setConfirmAdmin] = useState(false)
  const [recentTeamFilter, setRecentTeamFilter] = useState<string>('all')
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const donutChartRef = useRef<HTMLDivElement>(null)
  const teamChartRef = useRef<HTMLDivElement>(null)
  const trendChartRef = useRef<HTMLDivElement>(null)

  const byStatus = useMemo(() => countByStatus(tasks), [tasks])
  const byTeamStatus = useMemo(() => countByTeamAndStatus(tasks, teams), [tasks, teams])
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

  const handleExport = async () => {
    setExporting(true)
    setExportError(null)
    try {
      const charts = await captureCharts([
        { title: 'สัดส่วนงานตามสถานะ', ref: donutChartRef },
        { title: 'งานตามทีม', ref: teamChartRef },
        { title: 'แนวโน้มการปิดงาน (รายสัปดาห์)', ref: trendChartRef },
      ])
      if (charts.length === 0) console.warn('[export] no charts captured — the Excel file will not include a Charts sheet')
      await exportSummaryXlsx(tasks, teams, members, workloads, charts)
    } catch (err) {
      console.error('[export] failed', err)
      setExportError(err instanceof Error ? err.message : 'Export ไม่สำเร็จ')
    } finally {
      setExporting(false)
    }
  }

  return (
    <AsyncState loading={loading} error={error}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard label="งานทั้งหมด" value={tasks.length} icon={ListTodo} tone="neutral" />
          <StatCard label="กำลังดำเนินการ" value={byStatus.doing} icon={Clock} tone="warning" />
          <StatCard label="เสร็จแล้ว" value={byStatus.done} icon={CheckCircle2} tone="success" />
          <StatCard label="ใกล้ครบกำหนด" value={dueSoonCount} icon={TimerReset} tone="default" />
          <StatCard label="เกินกำหนด" value={overdueCount} icon={AlertOctagon} tone="danger" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card title="สัดส่วนงานตามสถานะ" className="lg:col-span-1">
            <StatusDonutChart byStatus={byStatus} total={tasks.length} chartRef={donutChartRef} />
          </Card>

          <Card title="งานตามทีม">
            <TeamStatusBarChart data={byTeamStatus} chartRef={teamChartRef} />
          </Card>

          <Card title="แนวโน้มการปิดงาน (รายสัปดาห์)">
            <WeeklyTrendChart data={weeklyTrend} chartRef={trendChartRef} />
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card
            title="งานล่าสุด"
            className="lg:col-span-2"
            action={
              <div className="flex items-center gap-2">
                <DropdownSelect
                  value={recentTeamFilter}
                  label="ทุกทีม"
                  options={[{ value: 'all', label: 'ทุกทีม' }, ...teams.map((tm) => ({ value: tm.id, label: tm.name }))]}
                  onChange={(value) => setRecentTeamFilter(value)}
                />
                <Link to="/tasks" className="text-xs font-medium text-primary-600 hover:underline">
                  View All
                </Link>
              </div>
            }
          >
            {recentTeamFilter === 'all' && (
              <p className="mb-3 text-xs text-ink-400">แสดงงานล่าสุด 1 รายการต่อทีม เพื่อให้เห็นภาพรวมทุกทีมพร้อมกัน</p>
            )}
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-ink-400">
                    <th className="w-[30%] rounded-l-lg bg-surface-100 py-2.5 pl-4 font-semibold">Task</th>
                    <th className="w-[18%] bg-surface-100 py-2.5 font-semibold">Assigned</th>
                    <th className="w-[12%] bg-surface-100 py-2.5 font-semibold">Status</th>
                    <th className="w-[12%] bg-surface-100 py-2.5 font-semibold">Priority</th>
                    <th className="w-[14%] bg-surface-100 py-2.5 font-semibold">Due Date</th>
                    <th className="w-[14%] rounded-r-lg bg-surface-100 py-2.5 pr-4 font-semibold">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.map((tsk) => {
                    const owner = memberById.get(tsk.owner_id ?? '')
                    const team = teamById.get(tsk.team_id ?? '')
                    const teamStyle = getTeamBadgeStyle(tsk.team_id)
                    const overdue = isOverdue(tsk)
                    const rowBg = STATUS_ROW_BG[tsk.status]
                    return (
                      <tr key={tsk.id} className="group">
                        <td
                          className={`rounded-l-lg border-l-4 py-3.5 pl-4 shadow-sm transition group-hover:brightness-95 ${rowBg}`}
                          style={{ borderLeftColor: STATUS_COLORS[tsk.status] }}
                        >
                          <p className="truncate font-semibold text-ink-900">{tsk.title}</p>
                          <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium shadow-sm ${teamStyle.bg} ${teamStyle.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${teamStyle.dot}`} />
                            {team?.name ?? 'ไม่ระบุทีม'}
                          </span>
                        </td>
                        <td className={`py-3.5 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>
                          {owner ? (
                            <div className="flex items-center gap-2">
                              <div className="rounded-full shadow-sm ring-2 ring-white">
                                <Avatar id={owner.id} name={owner.name} size={24} />
                              </div>
                              <span className="truncate text-ink-600">{owner.name}</span>
                            </div>
                          ) : (
                            <span className="text-ink-400">-</span>
                          )}
                        </td>
                        <td className={`py-3.5 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>
                          <StatusBadge status={tsk.status} />
                        </td>
                        <td className={`py-3.5 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>
                          <PriorityFlag priority={tsk.priority} />
                        </td>
                        <td className={`py-3.5 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
                              overdue ? 'bg-danger-100 text-danger-700' : 'text-ink-500'
                            }`}
                          >
                            {overdue ? <AlertOctagon size={13} /> : <Clock size={13} className="text-ink-300" />}
                            {formatDueDate(tsk.due_date)}
                          </span>
                        </td>
                        <td className={`rounded-r-lg py-3.5 pr-4 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>
                          <div className="flex items-center gap-2">
                            <ProgressBar
                              value={tsk.progress}
                              className="w-16"
                              tone={tsk.progress >= 100 ? 'success' : tsk.progress >= 50 ? 'primary' : 'warning'}
                            />
                            <span className="tabular-nums text-xs text-ink-500">{tsk.progress}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {recentTasks.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState py="sm">
                          {recentTeamFilter === 'all'
                            ? 'ยังไม่มีข้อมูลงาน — ลองเพิ่มงานที่หน้า Admin'
                            : 'ไม่พบงานของทีมนี้'}
                        </EmptyState>
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
              <Link to="/workload" className="text-xs font-medium text-primary-600 hover:underline">
                Details
              </Link>
            }
          >
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="text-danger-600">เยอะเกิน {workloads.filter((w) => w.level === 'overload').length}</span>
              <span className="text-success-600">พอดี {workloads.filter((w) => w.level === 'balanced').length}</span>
              <span className="text-warning-600">น้อยเกิน {workloads.filter((w) => w.level === 'underload').length}</span>
            </div>
            <div className="space-y-2.5">
              {workloads.slice(0, 3).map((w) => (
                <div key={w.member.id} className="rounded-lg border border-border-100 p-3 text-sm">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <p className="truncate font-semibold text-ink-800">{w.member.name}</p>
                    <WorkloadBadge level={w.level} />
                  </div>
                  <p className="text-xs text-ink-500">
                    Tasks: <span className="font-medium text-ink-700">{w.openTaskCount} left</span>
                    <span className="mx-1.5 text-ink-300">|</span>
                    Effort: <span className="font-medium text-ink-700">{w.totalEffortDays} days</span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-ink-400">{w.reason}</p>
                </div>
              ))}
              {workloads.length === 0 && <p className="text-sm text-ink-400">ยังไม่มีสมาชิกในทีม</p>}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 items-start">
          <Card title="จัดการข้อมูล">
            <div className="flex flex-col items-center gap-2.5 text-center">
              <p className="text-sm text-ink-500 max-w-xl">
                จัดการทีมได้ที่หน้า Admin ส่วนงานและสมาชิกจัดการได้ในหน้ารายละเอียดของแต่ละทีม
              </p>
              <button
                type="button"
                onClick={() => setConfirmAdmin(true)}
                className={`${primaryBtnClass} inline-flex items-center gap-2 whitespace-nowrap self-center`}
              >
                <ShieldCheck size={16} />
                ไปที่หน้า Admin
              </button>
            </div>
          </Card>

          <AiSummaryCard tasks={tasks} workloads={workloads} />

          <Card title="Export Results">
            <div className="flex flex-col items-center gap-2.5 text-center">
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={tasks.length === 0 || exporting}
                className={`${primaryBtnClass} inline-flex items-center gap-2 whitespace-nowrap self-center`}
              >
                <FileSpreadsheet size={16} />
                {exporting ? 'กำลังสร้างไฟล์...' : 'Export Summary (Excel)'}
              </button>
              {exportError && <p className="text-xs text-danger-600">เกิดข้อผิดพลาด: {exportError}</p>}
            </div>
          </Card>
        </div>
      </div>
        <Modal
          open={confirmAdmin}
          onClose={() => setConfirmAdmin(false)}
          title="ไปที่หน้า Admin"
          description="คุณต้องการไปยังหน้าจัดการข้อมูล (Admin) หรือไม่?"
          icon={Info}
          widthClassName="max-w-md"
          footer={
            <>
              <button type="button" onClick={() => setConfirmAdmin(false)} className={cancelBtnClass}>
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmAdmin(false)
                  navigate('/admin')
                }}
                className={primaryBtnClass}
              >
                ไปที่ Admin
              </button>
            </>
          }
        >
          <div className="space-y-3">
            <p className="text-sm text-ink-600">หน้าจัดการ (Admin) ให้คุณจัดการทีม สมาชิก และดูสรุปข้อมูลทั้งหมดของระบบ</p>
            <p className="text-sm text-ink-500">คลิก "ไปที่ Admin" เพื่อไปยังหน้าจัดการ</p>
          </div>
        </Modal>
    </AsyncState>
  )
}
