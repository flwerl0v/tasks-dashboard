import { useMemo, useState } from 'react'
import { LayoutGrid, List, Search } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { AsyncState } from '../components/ui/AsyncState'
import { Card } from '../components/ui/Card'
import { PriorityBadge } from '../components/ui/Badge'
import { TaskBoard } from '../components/tasks/TaskBoard'
import type { TaskPriority, TaskStatus } from '../types'

const STATUS_OPTIONS: Array<TaskStatus | 'all'> = ['all', 'todo', 'doing', 'done', 'blocked']
const PRIORITY_OPTIONS: Array<TaskPriority | 'all'> = ['all', 'low', 'medium', 'high', 'critical']
const PRIORITY_ORDER: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }

export default function Tasks() {
  const { teams, members, tasks, loading, error, setTaskStatus } = useAppData()
  const [view, setView] = useState<'board' | 'list'>('board')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')

  const teamById = useMemo(() => new Map(teams.map((tm) => [tm.id, tm])), [teams])
  const memberById = useMemo(() => new Map(members.map((m) => [m.id, m])), [members])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter((tsk) => {
      if (statusFilter !== 'all' && tsk.status !== statusFilter) return false
      if (priorityFilter !== 'all' && tsk.priority !== priorityFilter) return false
      if (teamFilter !== 'all' && tsk.team_id !== teamFilter) return false
      if (q) {
        const owner = memberById.get(tsk.owner_id ?? '')?.name ?? ''
        if (!tsk.title.toLowerCase().includes(q) && !owner.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [tasks, statusFilter, priorityFilter, teamFilter, search, memberById])

  const sortedFiltered = useMemo(
    () => [...filtered].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]),
    [filtered],
  )

  return (
    <AsyncState loading={loading} error={error}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหางาน หรือผู้รับผิดชอบ..."
              className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === 'all' ? 'ทุกสถานะ' : s}
              </option>
            ))}
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
          >
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>
                {p === 'all' ? 'ทุก Priority' : p}
              </option>
            ))}
          </select>
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

          <div className="ml-auto flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setView('board')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'board' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid size={14} />
              Board
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'list' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <List size={14} />
              List
            </button>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          แสดง {filtered.length} จากทั้งหมด {tasks.length} งาน
        </p>

        {view === 'board' ? (
          <TaskBoard
            tasks={filtered}
            teamById={teamById}
            memberById={memberById}
            onStatusChange={(taskId, status) => void setTaskStatus(taskId, status)}
          />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs text-slate-400">
                    <th className="pb-2 font-medium">Task</th>
                    <th className="pb-2 font-medium">Team</th>
                    <th className="pb-2 font-medium">Owner</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Priority</th>
                    <th className="pb-2 font-medium">Due Date</th>
                    <th className="pb-2 font-medium">Progress</th>
                    <th className="pb-2 font-medium">Effort (วัน)</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedFiltered.map((tsk) => (
                    <tr key={tsk.id} className="border-b border-slate-50 last:border-0">
                      <td className="py-2.5 font-medium text-slate-700">{tsk.title}</td>
                      <td className="py-2.5 text-slate-500">{teamById.get(tsk.team_id ?? '')?.name ?? '-'}</td>
                      <td className="py-2.5 text-slate-500">{memberById.get(tsk.owner_id ?? '')?.name ?? '-'}</td>
                      <td className="py-2.5">
                        <select
                          value={tsk.status}
                          onChange={(e) => void setTaskStatus(tsk.id, e.target.value as TaskStatus)}
                          className="rounded-md border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-400"
                          title="เปลี่ยนสถานะ"
                        >
                          {(['todo', 'doing', 'done', 'blocked'] as TaskStatus[]).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2.5"><PriorityBadge priority={tsk.priority} /></td>
                      <td className="py-2.5 text-slate-500">{tsk.due_date ?? '-'}</td>
                      <td className="py-2.5 text-slate-500">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full bg-blue-500" style={{ width: `${tsk.progress}%` }} />
                          </div>
                          <span className="text-xs">{tsk.progress}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-slate-500">{tsk.effort_days}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        ไม่พบงานที่ตรงกับเงื่อนไข
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AsyncState>
  )
}
