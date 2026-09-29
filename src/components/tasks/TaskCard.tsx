import { AlertCircle, Calendar, UserX } from 'lucide-react'
import type { Member, Task, TaskStatus, Team } from '../../types'
import { PriorityBadge } from '../ui/Badge'
import { statusDropdownOption } from '../../lib/dropdownColors'
import { ProgressBar } from '../ui/ProgressBar'
import { DropdownSelect } from '../ui/DropdownSelect'
import { getTeamBadgeStyle } from '../../lib/teamColor'
import { daysSince, isOverdue } from '../../lib/stats'
import { Avatar } from '../ui/Avatar'

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
  <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md">
    <div className="mb-3 flex items-start justify-between gap-3">
      <div className="flex flex-col gap-2">
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${badge.bg} ${badge.text}`}>
          {team?.name ?? 'Unassigned'}
        </span>
        <p className="text-sm font-semibold text-slate-900 line-clamp-2">{task.title}</p>
      </div>

      <PriorityBadge priority={task.priority} />
    </div>

    {(blocked || overdue) && (
      <p className="mb-3 flex items-center gap-2 rounded-2xl bg-danger-50 px-3 py-2 text-xs font-medium text-danger-700">
        <AlertCircle size={14} />
        {blocked ? `ติดปัญหามาแล้ว ${daysSince(task.updated_at)} วัน` : `เกินกำหนด ${daysSince(task.due_date!)} วัน`}
      </p>
    )}

    {!owner && (
      <p className="mb-3 flex items-center gap-2 rounded-2xl bg-warning-50 px-3 py-2 text-xs font-bold text-warning-700">
        <UserX size={14} />
        ยังไม่มีผู้รับผิดชอบ
      </p>
    )}

    {dueLabel && (
      <p className="mb-3 flex items-center gap-2 text-xs text-slate-500">
        <Calendar size={12} />
        {dueLabel}
      </p>
    )}

    <div className="mb-4 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">Progress</span>
        <span className="text-xs font-semibold text-slate-600">{task.progress}%</span>
      </div>
      <ProgressBar
        value={task.progress}
        size="sm"
        className="flex-1 h-2 rounded-full"
        tone={task.progress >= 100 ? 'success' : task.progress >= 50 ? 'primary' : 'warning'}
      />
    </div>

    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {owner ? (
          <Avatar id={owner.id} name={owner.name} size={24} />
        ) : (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-warning-100 text-warning-600">
            <UserX size={15} />
          </div>
        )}
        <div className="min-w-0">
          <p className={`truncate text-sm font-medium ${owner ? 'text-slate-800' : 'text-warning-700'}`}>
            {owner?.name ?? 'ยังไม่มอบหมาย'}
          </p>
          <p className="text-xs text-slate-400">Owner</p>
        </div>
      </div>

      <DropdownSelect
        value={task.status}
        label="สถานะ"
        options={STATUS_OPTIONS.map((s) => ({ value: s, label: s, ...statusDropdownOption(s) }))}
        onChange={(value) => onStatusChange(value)}
        buttonClassName="px-3 py-1 text-xs"
      />
    </div>
  </div>
  )
}
