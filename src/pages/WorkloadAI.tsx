import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
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
import { useAppData } from '../context/AppDataContext'
import { AsyncState } from '../components/ui/AsyncState'
import { Card } from '../components/ui/Card'
import { WorkloadBadge } from '../components/ui/Badge'
import { computeMemberWorkloads, computeTeamWorkloadSummary } from '../lib/workload'
import { WORKLOAD_CONFIG } from '../lib/workloadConfig'
import type { WorkloadLevel } from '../types'

const LEVEL_COLORS: Record<WorkloadLevel, string> = {
  overload: '#f43f5e',
  balanced: '#10b981',
  underload: '#f59e0b',
}
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

  const workloads = useMemo(() => computeMemberWorkloads(members, tasks), [members, tasks])
  const teamSummary = useMemo(() => computeTeamWorkloadSummary(teams, workloads), [teams, workloads])

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
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อผู้รับผิดชอบ..."
              className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
          >
            <option value="all">ทุกทีม</option>
            {teams.map((tm) => (
              <option key={tm.id} value={tm.id}>
                {tm.name}
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-400">
            แสดง {filteredWorkloads.length} จากทั้งหมด {workloads.length} คน
          </span>
        </div>

        <Card
          title="Load Score รายบุคคล (%)"
          action={
            <span className="text-xs text-slate-400">
              เกณฑ์: &lt;{WORKLOAD_CONFIG.underloadBelow}% น้อยเกิน · {WORKLOAD_CONFIG.underloadBelow}-
              {WORKLOAD_CONFIG.overloadAbove}% พอดี · &gt;{WORKLOAD_CONFIG.overloadAbove}% เยอะเกิน
            </span>
          }
        >
          {chartData.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">ไม่พบผู้รับผิดชอบที่ตรงกับเงื่อนไข</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={Math.max(160, chartData.length * 40)}>
                <BarChart data={chartData} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
                  <ReferenceLine x={WORKLOAD_CONFIG.underloadBelow} stroke="#cbd5e1" strokeDasharray="4 4" />
                  <ReferenceLine x={WORKLOAD_CONFIG.overloadAbove} stroke="#cbd5e1" strokeDasharray="4 4" />
                  <Tooltip formatter={(value) => [`${value}%`, 'Load Score']} cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="loadScore" radius={[0, 4, 4, 0]} maxBarSize={22}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={LEVEL_COLORS[entry.level]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
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
              <CartesianGrid horizontal={false} stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} unit="%" />
              <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 12, fill: '#334155' }} axisLine={false} tickLine={false} />
              <ReferenceLine x={WORKLOAD_CONFIG.underloadBelow} stroke="#cbd5e1" strokeDasharray="4 4" />
              <ReferenceLine x={WORKLOAD_CONFIG.overloadAbove} stroke="#cbd5e1" strokeDasharray="4 4" />
              <Tooltip formatter={(value) => [`${value}%`, 'Load Score เฉลี่ย']} cursor={{ fill: '#f1f5f9' }} />
              <Bar dataKey="loadScore" radius={[0, 4, 4, 0]} maxBarSize={22}>
                {teamChartData.map((entry) => (
                  <Cell key={entry.name} fill={LEVEL_COLORS[entry.level]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {teamSummary.map((s) => (
              <div key={s.team.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                <p className="font-medium text-slate-700">{s.team.name}</p>
                <p className="text-xs text-slate-400">{s.memberCount} คน · เฉลี่ย {s.avgLoadScore}%</p>
                <div className="mt-2 flex gap-3 text-xs">
                  <span className="text-rose-600">เยอะเกิน {s.overloadCount}</span>
                  <span className="text-emerald-600">พอดี {s.balancedCount}</span>
                  <span className="text-amber-600">น้อยเกิน {s.underloadCount}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="AI ประเมินภาระงานรายคน">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="pb-2 pr-4 font-medium">ผู้รับผิดชอบ</th>
                  <th className="pb-2 pr-4 font-medium">งานคงเหลือ</th>
                  <th className="pb-2 pr-4 font-medium">Load Score</th>
                  <th className="pb-2 pr-4 font-medium">เกินกำหนด</th>
                  <th className="pb-2 pr-4 font-medium">สถานะ (AI)</th>
                  <th className="pb-2 pr-4 font-medium">เหตุผลโดยย่อ</th>
                  <th className="pb-2 font-medium">คำแนะนำ</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkloads.map((w) => (
                  <tr key={w.member.id} className="border-b border-slate-50 last:border-0 align-top">
                    <td className="py-2.5 pr-4 font-medium text-slate-700">{w.member.name}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{w.openTaskCount}</td>
                    <td className="py-2.5 pr-4">
                      <span className="font-semibold" style={{ color: LEVEL_COLORS[w.level] }}>
                        {w.loadScore}%
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-500">{w.overdueCount}</td>
                    <td className="py-2.5 pr-4"><WorkloadBadge level={w.level} /></td>
                    <td className="py-2.5 pr-4 max-w-xs text-slate-500">{w.reason}</td>
                    <td className="py-2.5 max-w-xs text-slate-500">{w.suggestedAction ?? '-'}</td>
                  </tr>
                ))}
                {filteredWorkloads.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-400">
                      {workloads.length === 0 ? 'ยังไม่มีสมาชิกในระบบ' : 'ไม่พบผู้รับผิดชอบที่ตรงกับเงื่อนไข'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AsyncState>
  )
}
