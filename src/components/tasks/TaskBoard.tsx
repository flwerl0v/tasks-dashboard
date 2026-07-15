import type { Member, Task, TaskStatus, Team } from '../../types'
import { TaskCard } from './TaskCard'

const COLUMNS: Array<{ status: TaskStatus; label: string; dot: string }> = [
  { status: 'todo', label: 'To Do', dot: 'bg-slate-400' },
  { status: 'doing', label: 'Doing', dot: 'bg-blue-500' },
  { status: 'blocked', label: 'Blocked', dot: 'bg-rose-500' },
  { status: 'done', label: 'Done', dot: 'bg-emerald-500' },
]

const PRIORITY_ORDER: Record<Task['priority'], number> = { critical: 0, high: 1, medium: 2, low: 3 }

function byDueDateAsc(a: Task, b: Task): number {
  if (!a.due_date && !b.due_date) return 0
  if (!a.due_date) return 1
  if (!b.due_date) return -1
  return a.due_date.localeCompare(b.due_date)
}

function byPriorityThenDueDate(a: Task, b: Task): number {
  const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
  return priorityDiff !== 0 ? priorityDiff : byDueDateAsc(a, b)
}

interface TaskBoardProps {
  tasks: Task[]
  teamById: Map<string, Team>
  memberById: Map<string, Member>
  onStatusChange: (taskId: string, status: TaskStatus) => void
}

export function TaskBoard({ tasks, teamById, memberById, onStatusChange }: TaskBoardProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {COLUMNS.map((col) => {
        const columnTasks = tasks.filter((tsk) => tsk.status === col.status).sort(byPriorityThenDueDate)
        return (
          <div key={col.status} className="flex flex-col rounded-xl bg-slate-100/70 p-3">
            <div className="mb-3 flex items-center gap-2 px-1">
              <span className={`h-2 w-2 rounded-full ${col.dot}`} />
              <h3 className="text-sm font-semibold text-slate-700">{col.label}</h3>
              <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-500">
                {columnTasks.length}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {columnTasks.map((tsk) => (
                <TaskCard
                  key={tsk.id}
                  task={tsk}
                  team={teamById.get(tsk.team_id ?? '') ?? null}
                  owner={memberById.get(tsk.owner_id ?? '') ?? null}
                  onStatusChange={(status) => onStatusChange(tsk.id, status)}
                />
              ))}
              {columnTasks.length === 0 && (
                <p className="rounded-lg border border-dashed border-slate-300 py-6 text-center text-xs text-slate-400">
                  ไม่มีงาน
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
