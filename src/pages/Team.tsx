import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Search } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { AsyncState } from '../components/ui/AsyncState'
import { Card } from '../components/ui/Card'
import { getTeamBadgeStyle } from '../lib/teamColor'
import { isOverdue } from '../lib/stats'
import type { Member, Task } from '../types'

export default function Team() {
  const { teams, members, tasks, loading, error } = useAppData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('')

  const membersByTeam = useMemo(() => {
    const map = new Map<string, Member[]>()
    members.forEach((m) => {
      if (!m.team_id) return
      map.set(m.team_id, [...(map.get(m.team_id) ?? []), m])
    })
    return map
  }, [members])

  const tasksByTeam = useMemo(() => {
    const map = new Map<string, Task[]>()
    tasks.forEach((tsk) => {
      if (!tsk.team_id) return
      map.set(tsk.team_id, [...(map.get(tsk.team_id) ?? []), tsk])
    })
    return map
  }, [tasks])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return teams.filter((tm) => {
      if (teamFilter && tm.id !== teamFilter) return false
      if (q && !tm.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [teams, search, teamFilter])

  const totalMembers = members.length

  return (
    <AsyncState loading={loading} error={error}>
      <div className="space-y-4">
        <p className="text-sm text-slate-500">
          <span className="font-semibold text-slate-800">{filtered.length} ทีม</span> · {totalMembers} สมาชิกทั้งหมด
        </p>

        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative w-full max-w-xs">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="ค้นหาทีม..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 outline-none focus:border-blue-400"
            >
              <option value="">ทุกทีม</option>
              {[...teams]
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((tm) => (
                  <option key={tm.id} value={tm.id}>
                    {tm.name}
                  </option>
                ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <p className="py-10 text-center text-slate-400">
              {search || teamFilter ? 'ไม่พบทีมที่ตรงกับเงื่อนไข' : 'ยังไม่มีทีม — ไปที่หน้า Admin เพื่อเพิ่มทีมและสมาชิก'}
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((team) => {
                const teamMembers = membersByTeam.get(team.id) ?? []
                const teamTasks = tasksByTeam.get(team.id) ?? []
                const active = teamTasks.filter((t) => t.status !== 'done').length
                const donePercent =
                  teamTasks.length > 0
                    ? Math.round((teamTasks.filter((t) => t.status === 'done').length / teamTasks.length) * 100)
                    : 0
                const overdue = teamTasks.filter(isOverdue).length
                const style = getTeamBadgeStyle(team.id)
                const visibleMembers = teamMembers.slice(0, 5)
                const extraMemberCount = teamMembers.length - visibleMembers.length

                return (
                  <div
                    key={team.id}
                    onClick={() => navigate(`/admin/teams/${team.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/admin/teams/${team.id}`)}
                    className={`cursor-pointer rounded-xl border border-t-4 border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${style.border}`}
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white ${style.solid}`}>
                        {team.name.trim().slice(0, 1).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate font-semibold text-slate-800">{team.name}</p>
                          {team.category && (
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${style.bg} ${style.text}`}>
                              {team.category}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-400">{teamMembers.length} สมาชิก</p>
                      </div>
                    </div>

                    <div className="mb-3 flex items-center">
                      {visibleMembers.map((m, i) => (
                        <span
                          key={m.id}
                          title={m.name}
                          style={{ zIndex: visibleMembers.length - i }}
                          className={`flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold text-slate-600 ${getTeamBadgeStyle(m.id).bg} ${i > 0 ? '-ml-2' : ''}`}
                        >
                          {m.name.trim().slice(0, 1).toUpperCase()}
                        </span>
                      ))}
                      {extraMemberCount > 0 && (
                        <span className="-ml-2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[11px] font-semibold text-slate-500">
                          +{extraMemberCount}
                        </span>
                      )}
                      {teamMembers.length === 0 && <span className="text-xs text-slate-300">ยังไม่มีสมาชิก</span>}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-amber-50 px-2 py-2 text-center">
                        <p className="text-lg font-bold tabular-nums text-amber-600">{active}</p>
                        <p className="text-[11px] text-amber-600/80">กำลังทำ</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 px-2 py-2 text-center">
                        <p className="text-lg font-bold tabular-nums text-emerald-600">{donePercent}%</p>
                        <p className="text-[11px] text-emerald-600/80">สำเร็จ</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2.5 text-xs text-slate-400">
                      <span>งานทั้งหมด {teamTasks.length} งาน</span>
                      {overdue > 0 && (
                        <span className="flex items-center gap-1 font-medium text-rose-500">
                          <AlertTriangle size={12} />
                          เกินกำหนด {overdue}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
    </AsyncState>
  )
}
