import type { ReactNode } from 'react'
import { getTeamBadgeStyle } from '../../lib/teamColor'
import { isOverdue } from '../../lib/stats'
import { StatusStack } from './StatusStack'
import { nameInitial as initial } from '../../lib/nameInitial'
import type { Member, Task, Team } from '../../types'

interface TeamCardProps {
  team: Team
  members: Member[]
  tasks: Task[]
  onOpen: () => void
  /** Right side of the header (Admin passes its "เพิ่มงาน" button and the ⋮ menu). Clicks there must stop propagation. */
  actions?: ReactNode
}

const DAY_MS = 1000 * 60 * 60 * 24

function daysOverdue(task: Task, today: Date): number {
  return Math.max(0, Math.round((today.getTime() - new Date(task.due_date as string).getTime()) / DAY_MS))
}

export function TeamCard({ team, members, tasks, onOpen, actions }: TeamCardProps) {
  const style = getTeamBadgeStyle(team.id)
  const total = tasks.length
  const overdueTasks = tasks.filter(isOverdue)
  const today = new Date(new Date().toDateString())
  const oldest = overdueTasks.reduce((max, t) => Math.max(max, daysOverdue(t, today)), 0)
  const visibleMembers = members.slice(0, 5)
  const extraMembers = members.length - visibleMembers.length

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen()
      }}
      className={`cursor-pointer rounded-md border bg-surface p-4 transition-colors ${
        overdueTasks.length > 0 ? 'border-danger-500/35 hover:border-danger-500' : 'border-border hover:border-ink-400'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white ${style.solid}`}>
          {initial(team.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-semibold text-ink-900">{team.name}</p>
            {team.category && (
              <span className="rounded bg-surface-100 px-1.5 py-0.5 text-[11px] font-medium text-ink-600">{team.category}</span>
            )}
          </div>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-500">
            <span>{members.length} สมาชิก</span>
            <span className="flex items-center">
              {visibleMembers.map((m, i) => (
                <span
                  key={m.id}
                  title={m.name}
                  style={{ zIndex: visibleMembers.length - i }}
                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-white text-[10px] font-semibold text-white ${getTeamBadgeStyle(m.id).solid} ${i > 0 ? '-ml-1.5' : ''}`}
                >
                  {initial(m.name)}
                </span>
              ))}
              {extraMembers > 0 && (
                <span className="-ml-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-surface-100 text-[10px] font-semibold text-ink-500">
                  +{extraMembers}
                </span>
              )}
            </span>
          </div>
        </div>
        {actions}
      </div>

      <div className="mt-4">
        <StatusStack tasks={tasks} />
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border-100 pt-3 text-xs text-ink-500">
        <span>ทั้งหมด {total} งาน</span>
        {overdueTasks.length > 0 ? (
          <span className="font-medium text-danger-700">
            เกินกำหนด {overdueTasks.length} งาน · นานสุด {oldest} วัน
          </span>
        ) : (
          <span>{total > 0 ? 'ไม่มีงานเกินกำหนด' : ''}</span>
        )}
      </div>
    </div>
  )
}
