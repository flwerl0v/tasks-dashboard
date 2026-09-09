import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, Bot, CheckCircle2, TrendingDown } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { AsyncState } from '../components/ui/AsyncState'
import { Card } from '../components/ui/Card'
import { StatCard } from '../components/ui/StatCard'
import { WorkloadBadge } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { SearchInput } from '../components/ui/SearchInput'
import { EmptyState } from '../components/ui/EmptyState'
import { DropdownSelect } from '../components/ui/DropdownSelect'
import { AiInsightModal } from '../components/workload/AiInsightModal'
import { TeamWorkloadInsightCard } from '../components/workload/TeamWorkloadInsightCard'
import { computeMemberWorkloads, computeTeamWorkloadSummary } from '../lib/workload'
import { WORKLOAD_CONFIG } from '../lib/workloadConfig'
import { LEVEL_COLORS, LEVEL_ROW_BG, chartColors } from '../lib/colors'
import type { MemberWorkload, WorkloadLevel } from '../types'

const LEVEL_LABELS: Record<WorkloadLevel, string> = { overload: 'เยอะเกิน', balanced: 'พอดี', underload: 'น้อยเกิน' }

function levelOf(loadScore: number): WorkloadLevel {
  if (loadScore > WORKLOAD_CONFIG.overloadAbove) return 'overload'
  if (loadScore < WORKLOAD_CONFIG.underloadBelow) return 'underload'
  return 'balanced'
}

export default function WorkloadAI() {
  const { teams, members, tasks, loading, error } = useAppData()
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [insightMember, setInsightMember] = useState<MemberWorkload | null>(null)

  const workloads = useMemo(() => computeMemberWorkloads(members, tasks), [members, tasks])
  const teamSummary = useMemo(() => computeTeamWorkloadSummary(teams, workloads), [teams, workloads])
  const overloadCount = useMemo(() => workloads.filter((w) => w.level === 'overload').length, [workloads])
  const balancedCount = useMemo(() => workloads.filter((w) => w.level === 'balanced').length, [workloads])
  const underloadCount = useMemo(() => workloads.filter((w) => w.level === 'underload').length, [workloads])

  const filteredWorkloads = useMemo(() => {
    const q = search.trim().toLowerCase()
    return workloads.filter((w) => {
      if (teamFilter !== 'all' && w.member.team_id !== teamFilter) return false
      if (q && !w.member.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [workloads, search, teamFilter])

  const chartData = filteredWorkloads.map((w) => ({ name: w.member.name, loadScore: w.loadScore, level: w.level }))
  const teamChartData = teamSummary.map((s) => ({
    name: s.team.name,
    loadScore: s.avgLoadScore,
    level: levelOf(s.avgLoadScore),
  }))

  return (
    <AsyncState loading={loading} error={error}>
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard label="เยอะเกิน" value={overloadCount} icon={AlertTriangle} tone="danger" />
          <StatCard label="พอดี" value={balancedCount} icon={CheckCircle2} tone="success" />
          <StatCard label="น้อยเกิน" value={underloadCount} icon={TrendingDown} tone="warning" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="ค้นหาชื่อผู้รับผิดชอบ..." wrapperClassName="w-64" />
          <DropdownSelect
            value={teamFilter}
            label="ทุกทีม"
            options={[{ value: 'all', label: 'ทุกทีม' }, ...teams.map((tm) => ({ value: tm.id, label: tm.name }))]}
            onChange={(value) => setTeamFilter(value)}
          />
          <span className="text-sm text-ink-400">
            แสดง {filteredWorkloads.length} จากทั้งหมด {workloads.length} คน
          </span>
        </div>

        <Card
          title="Load Score รายบุคคล (%)"
          action={
            <span className="text-xs text-ink-400">
              เกณฑ์: &lt;{WORKLOAD_CONFIG.underloadBelow}% น้อยเกิน · {WORKLOAD_CONFIG.underloadBelow}-
              {WORKLOAD_CONFIG.overloadAbove}% พอดี · &gt;{WORKLOAD_CONFIG.overloadAbove}% เยอะเกิน
            </span>
          }
        >
          {chartData.length === 0 ? (
            <EmptyState py="lg">ไม่พบผู้รับผิดชอบที่ตรงกับเงื่อนไข</EmptyState>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 40)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid horizontal={false} stroke={chartColors.grid} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: chartColors.tick }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: chartColors.tickStrong }} axisLine={false} tickLine={false} />
                  <ReferenceLine x={WORKLOAD_CONFIG.underloadBelow} stroke={chartColors.referenceLine} strokeDasharray="4 4" />
                  <ReferenceLine x={WORKLOAD_CONFIG.overloadAbove} stroke={chartColors.referenceLine} strokeDasharray="4 4" />
                  <Tooltip formatter={(value) => [`${value}%`, 'Load Score']} cursor={{ fill: chartColors.cursor }} />
                  <Bar dataKey="loadScore" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={LEVEL_COLORS[entry.level]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-ink-500">
                {(['overload', 'balanced', 'underload'] as WorkloadLevel[]).map((level) => (
                  <span key={level} className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: LEVEL_COLORS[level] }} />
                    {LEVEL_LABELS[level]}
                  </span>
                ))}
              </div>
            </>
          )}
        </Card>

        <Card title="สรุปภาระงานเฉลี่ยตามทีม">
          <ResponsiveContainer width="100%" height={Math.max(180, teamChartData.length * 44)}>
            <BarChart data={teamChartData} layout="vertical" margin={{ left: 16 }}>
              <CartesianGrid horizontal={false} stroke={chartColors.grid} />
              <XAxis type="number" tick={{ fontSize: 12, fill: chartColors.tick }} axisLine={false} tickLine={false} unit="%" />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: chartColors.tickStrong }} axisLine={false} tickLine={false} />
              <ReferenceLine x={WORKLOAD_CONFIG.underloadBelow} stroke={chartColors.referenceLine} strokeDasharray="4 4" />
              <ReferenceLine x={WORKLOAD_CONFIG.overloadAbove} stroke={chartColors.referenceLine} strokeDasharray="4 4" />
              <Tooltip formatter={(value) => [`${value}%`, 'Load Score เฉลี่ย']} cursor={{ fill: chartColors.cursor }} />
              <Bar dataKey="loadScore" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {teamChartData.map((entry) => (
                  <Cell key={entry.name} fill={LEVEL_COLORS[entry.level]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {teamSummary.map((s) => (
              <div key={s.team.id} className="rounded-lg border border-border-100 p-3 text-sm">
                <p className="font-medium text-ink-700">{s.team.name}</p>
                <p className="text-xs text-ink-400">{s.memberCount} คน · เฉลี่ย {s.avgLoadScore}%</p>
                <div className="mt-2 flex gap-3 text-xs">
                  <span className="text-danger-600">เยอะเกิน {s.overloadCount}</span>
                  <span className="text-success-600">พอดี {s.balancedCount}</span>
                  <span className="text-warning-600">น้อยเกิน {s.underloadCount}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <TeamWorkloadInsightCard teamSummary={teamSummary} workloads={workloads} />

        <Card title="AI ประเมินภาระงานรายคน">
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-separate border-spacing-y-2 text-left text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-ink-400">
                  <th className="w-[14%] rounded-l-lg bg-surface-100 py-2.5 pl-4 font-semibold">ผู้รับผิดชอบ</th>
                  <th className="w-[8%] bg-surface-100 py-2.5 font-semibold">งานคงเหลือ</th>
                  <th className="w-[9%] bg-surface-100 py-2.5 font-semibold">Load Score</th>
                  <th className="w-[8%] bg-surface-100 py-2.5 font-semibold">เกินกำหนด</th>
                  <th className="w-[9%] bg-surface-100 py-2.5 font-semibold">สถานะ</th>
                  <th className="w-[24%] bg-surface-100 py-2.5 font-semibold">เหตุผลโดยย่อ</th>
                  <th className="w-[20%] bg-surface-100 py-2.5 font-semibold">คำแนะนำ</th>
                  <th className="w-[8%] rounded-r-lg bg-surface-100 py-2.5 pr-4 font-semibold">AI Insight</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkloads.map((w) => {
                  const rowBg = LEVEL_ROW_BG[w.level]
                  return (
                    <tr key={w.member.id} className="group align-top">
                      <td
                        className={`rounded-l-lg border-l-4 py-3 pl-4 shadow-sm transition group-hover:brightness-95 ${rowBg}`}
                        style={{ borderLeftColor: LEVEL_COLORS[w.level] }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="rounded-full shadow-sm ring-2 ring-white">
                            <Avatar id={w.member.id} name={w.member.name} size={24} />
                          </div>
                          <span className="truncate font-semibold text-ink-900">{w.member.name}</span>
                        </div>
                      </td>
                      <td className={`py-3 text-ink-500 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>{w.openTaskCount}</td>
                      <td className={`py-3 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>
                        <span className="font-semibold" style={{ color: LEVEL_COLORS[w.level] }}>
                          {w.loadScore}%
                        </span>
                      </td>
                      <td className={`py-3 text-ink-500 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>{w.overdueCount}</td>
                      <td className={`py-3 shadow-sm transition group-hover:brightness-95 ${rowBg}`}><WorkloadBadge level={w.level} /></td>
                      <td className={`py-3 pr-3 text-ink-500 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>{w.reason}</td>
                      <td className={`py-3 pr-3 text-ink-500 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>{w.suggestedAction}</td>
                      <td className={`rounded-r-lg py-3 pr-4 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>
                        <button
                          type="button"
                          onClick={() => setInsightMember(w)}
                          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50"
                        >
                          <Bot size={13} />
                          ดู Insight
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {filteredWorkloads.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState py="sm">
                        {workloads.length === 0 ? 'ยังไม่มีสมาชิกในระบบ' : 'ไม่พบผู้รับผิดชอบที่ตรงกับเงื่อนไข'}
                      </EmptyState>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <AiInsightModal workload={insightMember} tasks={tasks} onClose={() => setInsightMember(null)} />
    </AsyncState>
  )
}
