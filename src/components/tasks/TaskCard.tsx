import { AlertCircle, Calendar } from 'lucide-react'
import type { Member, Task, TaskStatus, Team } from '../../types'
import { PriorityBadge } from '../ui/Badge'
import { getTeamBadgeStyle } from '../../lib/teamColor'
import { daysSince, isOverdue } from '../../lib/stats'

const STATUS_OPTIONS: TaskStatus[] = ['todo', 'doing', 'done', 'blocked']

interface TaskCardProps {
  task: Task
  team: Team | null
  owner: Member | null
  onStatusChange: (status: TaskStatus) => void
}

export function TaskCard({ task, team, owner, onStatusChange }: TaskCardProps) {
  const badge = getTeamBadgeStyle(task.team_id)
  const overdue = isOverdue(task)
  const blocked = task.status === 'blocked'
  const dueLabel = task.due_date
    ? new Date(task.due_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    : null

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`truncate rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badge.bg} ${badge.text}`}>
          {team?.name ?? 'Unassigned'}
        </span>
        <PriorityBadge priority={task.priority} />
      </div>

      <p className="mb-2 line-clamp-2 text-sm font-medium text-slate-800">{task.title}</p>

      {(blocked || overdue) && (
        <p className="mb-2 flex items-center gap-1 text-xs font-medium text-rose-600">
          <AlertCircle size={12} />
          {blocked ? `ติดปัญหามาแล้ว ${daysSince(task.updated_at)} วัน` : `เกินกำหนด ${daysSince(task.due_date!)} วัน`}
        </p>
      )}

      {dueLabel && (
        <p className="mb-2 flex items-center gap-1 text-xs text-slate-400">
          <Calendar size={12} />
          {dueLabel}
        </p>
      )}

      <div className="mb-3 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-blue-500" style={{ width: `${task.progress}%` }} />
        </div>
        <span className="text-xs text-slate-400">{task.progress}%</span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">
            {owner?.name.slice(0, 1) ?? '-'}
          </div>
          <span className="truncate text-xs text-slate-500">{owner?.name ?? 'ยังไม่มอบหมาย'}</span>
        </div>
        <select
          value={task.status}
          onChange={(e) => onStatusChange(e.target.value as TaskStatus)}
          title="เปลี่ยนสถานะ"
          className="shrink-0 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] text-slate-500 outline-none focus:border-blue-400"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
