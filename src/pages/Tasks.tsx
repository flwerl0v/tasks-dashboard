import { useMemo, useState } from 'react'
import { AlertOctagon, Clock, LayoutGrid, List, ListChecks, Pencil, Trash2 } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { AsyncState } from '../components/ui/AsyncState'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { PriorityFlag } from '../components/ui/Badge'
import { Avatar } from '../components/ui/Avatar'
import { SearchInput } from '../components/ui/SearchInput'
import { ProgressBar } from '../components/ui/ProgressBar'
import { EmptyState } from '../components/ui/EmptyState'
import { inputClass, fieldLabelClass, cancelBtnClass, primaryBtnClass, ErrorNote } from '../components/ui/formStyles'
import { DropdownSelect } from '../components/ui/DropdownSelect'
import { SortHeader, TableFooter } from '../components/ui/tableParts'
import { useTableState } from '../lib/useTableState'
import { isOverdue } from '../lib/stats'
import { getTeamBadgeStyle } from '../lib/teamColor'
import { STATUS_COLORS, STATUS_ROW_BG } from '../lib/colors'
import { formatDueDate } from '../lib/format'
import { describeSupabaseError } from '../lib/errors'
import { TaskBoard } from '../components/tasks/TaskBoard'
import type { Task, TaskPriority, TaskStatus } from '../types'

const STATUS_OPTIONS: Array<TaskStatus | 'all'> = ['all', 'todo', 'doing', 'done', 'blocked']
const PRIORITY_OPTIONS: Array<TaskPriority | 'all'> = ['all', 'low', 'medium', 'high', 'critical']
const PRIORITY_ORDER: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const STATUS_ORDER: Record<TaskStatus, number> = { blocked: 0, doing: 1, todo: 2, done: 3 }


interface TaskFormState {
  title: string
  team_id: string
  owner_id: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string
  progress: string
  effort_days: string
}

const EMPTY_TASK_FORM: TaskFormState = {
  title: '',
  team_id: '',
  owner_id: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
  progress: '0',
  effort_days: '1',
}

export default function Tasks() {
  const { teams, members, tasks, loading, error, setTaskStatus, updateTask, deleteTask } = useAppData()
  const [view, setView] = useState<'board' | 'list'>('board')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all')
  const [teamFilter, setTeamFilter] = useState<string>('all')
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [taskForm, setTaskForm] = useState<TaskFormState>(EMPTY_TASK_FORM)
  const [taskFormError, setTaskFormError] = useState<string | null>(null)
  const [taskSubmitting, setTaskSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null)
  const [deleting, setDeleting] = useState(false)

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

  const getTaskSortValue = (task: Task, key: string) => {
    switch (key) {
      case 'owner':
        return memberById.get(task.owner_id ?? '')?.name.toLowerCase() ?? ''
      case 'team':
        return teamById.get(task.team_id ?? '')?.name.toLowerCase() ?? ''
      case 'status':
        return STATUS_ORDER[task.status]
      case 'priority':
        return PRIORITY_ORDER[task.priority]
      case 'due_date':
        return task.due_date ?? ''
      case 'progress':
        return task.progress
      default:
        return task.title.toLowerCase()
    }
  }

  const taskTable = useTableState(filtered, getTaskSortValue)

  const confirmDeleteTask = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteTask(deleteTarget.id)
      setDeleteTarget(null)
    } finally {
      setDeleting(false)
    }
  }

  const openEditTask = (task: Task) => {
    setEditingTaskId(task.id)
    setTaskForm({
      title: task.title,
      team_id: task.team_id ?? '',
      owner_id: task.owner_id ?? '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ?? '',
      progress: String(task.progress),
      effort_days: String(task.effort_days),
    })
    setTaskFormError(null)
    setTaskModalOpen(true)
  }

  const submitTaskEdit = async () => {
    if (!editingTaskId) return
    const title = taskForm.title.trim()
    if (!title) return
    const progress = Math.max(0, Math.min(100, Number(taskForm.progress) || 0))
    const effort_days = Math.max(0, Number(taskForm.effort_days) || 0)
    setTaskSubmitting(true)
    setTaskFormError(null)
    try {
      await updateTask(editingTaskId, {
        title,
        team_id: taskForm.team_id || null,
        owner_id: taskForm.owner_id || null,
        status: taskForm.status,
        priority: taskForm.priority,
        due_date: taskForm.due_date || null,
        progress,
        effort_days,
      })
      setTaskModalOpen(false)
    } catch (err) {
      setTaskFormError(describeSupabaseError(err, 'บันทึกงานไม่สำเร็จ'))
    } finally {
      setTaskSubmitting(false)
    }
  }

  return (
    <AsyncState loading={loading} error={error}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-3xl bg-slate-50 p-3">
          <SearchInput value={search} onChange={setSearch} placeholder="ค้นหางาน หรือผู้รับผิดชอบ..." wrapperClassName="w-64" />
          <DropdownSelect
            value={statusFilter}
            label="ทุกสถานะ"
            options={STATUS_OPTIONS.map((s) => ({ value: s, label: s === 'all' ? 'ทุกสถานะ' : s }))}
            onChange={(value) => setStatusFilter(value as TaskStatus | 'all')}
          />
          <DropdownSelect
            value={priorityFilter}
            label="ทุก Priority"
            options={PRIORITY_OPTIONS.map((p) => ({ value: p, label: p === 'all' ? 'ทุก Priority' : p }))}
            onChange={(value) => setPriorityFilter(value as TaskPriority | 'all')}
          />
          <DropdownSelect
            value={teamFilter}
            label="ทุกทีม"
            options={[{ value: 'all', label: 'ทุกทีม' }, ...teams.map((tm) => ({ value: tm.id, label: tm.name }))]}
            onChange={(value) => setTeamFilter(value)}
          />

          <div className="ml-auto flex items-center gap-1 rounded-2xl border border-border bg-surface p-1">
            <button
              type="button"
              onClick={() => setView('board')}
              className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'board' ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20' : 'text-ink-500 hover:bg-surface-100'
              }`}
            >
              <LayoutGrid size={14} />
              Board
            </button>
            <button
              type="button"
              onClick={() => setView('list')}
              className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-sm font-medium transition-colors ${
                view === 'list' ? 'bg-primary-600 text-white shadow-sm shadow-primary-600/20' : 'text-ink-500 hover:bg-surface-100'
              }`}
            >
              <List size={14} />
              List
            </button>
          </div>
        </div>

        <p className="text-sm text-ink-500">
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
              <table className="w-full table-fixed border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-ink-400">
                    <th className="w-10 rounded-l-lg bg-surface-100 py-2.5 pl-4 font-semibold">No</th>
                    <th className="bg-surface-100 py-2.5 pr-4 font-semibold">
                      <SortHeader label="งาน" sortKey="title" activeKey={taskTable.sortKey} dir={taskTable.sortDir} onSort={taskTable.toggleSort} />
                    </th>
                    <th className="bg-surface-100 py-2.5 pr-4 font-semibold">
                      <SortHeader label="ทีม" sortKey="team" activeKey={taskTable.sortKey} dir={taskTable.sortDir} onSort={taskTable.toggleSort} />
                    </th>
                    <th className="bg-surface-100 py-2.5 pr-4 font-semibold">
                      <SortHeader label="ผู้รับผิดชอบ" sortKey="owner" activeKey={taskTable.sortKey} dir={taskTable.sortDir} onSort={taskTable.toggleSort} />
                    </th>
                    <th className="bg-surface-100 py-2.5 pr-4 font-semibold">
                      <SortHeader label="ความสำคัญ" sortKey="priority" activeKey={taskTable.sortKey} dir={taskTable.sortDir} onSort={taskTable.toggleSort} />
                    </th>
                    <th className="bg-surface-100 py-2.5 pr-4 font-semibold">
                      <SortHeader label="กำหนดส่ง" sortKey="due_date" activeKey={taskTable.sortKey} dir={taskTable.sortDir} onSort={taskTable.toggleSort} />
                    </th>
                    <th className="bg-surface-100 py-2.5 pr-4 font-semibold">สถานะ</th>
                    <th className="bg-surface-100 py-2.5 pr-4 font-semibold">
                      <SortHeader label="ความคืบหน้า" sortKey="progress" activeKey={taskTable.sortKey} dir={taskTable.sortDir} onSort={taskTable.toggleSort} />
                    </th>
                    <th className="w-16 rounded-r-lg bg-surface-100 py-2.5 pr-4 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {taskTable.paged.map((tsk, i) => {
                    const owner = memberById.get(tsk.owner_id ?? '')
                    const team = teamById.get(tsk.team_id ?? '')
                    const teamStyle = getTeamBadgeStyle(tsk.team_id)
                    const overdue = isOverdue(tsk)
                    const rowBg = STATUS_ROW_BG[tsk.status]
                    return (
                      <tr key={tsk.id} className="group">
                        <td
                          className={`rounded-l-lg border-l-4 py-3.5 pl-4 text-xs text-ink-400 shadow-sm transition group-hover:brightness-95 ${rowBg}`}
                          style={{ borderLeftColor: STATUS_COLORS[tsk.status] }}
                        >
                          {(taskTable.page - 1) * taskTable.pageSize + i + 1}
                        </td>
                        <td className={`py-3.5 pr-4 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>
                          <p className="truncate font-semibold text-ink-900">{tsk.title}</p>
                        </td>
                        <td className={`py-3.5 pr-4 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium shadow-sm ${teamStyle.bg} ${teamStyle.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${teamStyle.dot}`} />
                            {team?.name ?? 'ไม่ระบุทีม'}
                          </span>
                        </td>
                        <td className={`py-3.5 pr-4 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>
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
                        <td className={`py-3.5 pr-4 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>
                          <PriorityFlag priority={tsk.priority} />
                        </td>
                        <td className={`py-3.5 pr-4 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium ${
                              overdue ? 'bg-danger-100 text-danger-700' : 'text-ink-500'
                            }`}
                          >
                            {overdue ? <AlertOctagon size={13} /> : <Clock size={13} className="text-ink-300" />}
                            {formatDueDate(tsk.due_date)}
                          </span>
                        </td>
                        <td className={`py-3.5 pr-4 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>
                          <DropdownSelect
                            value={tsk.status}
                            label="สถานะ"
                            options={(['todo', 'doing', 'done', 'blocked'] as TaskStatus[]).map((s) => ({ value: s, label: s }))}
                            onChange={(value) => void setTaskStatus(tsk.id, value)}
                            buttonClassName="px-3 py-1.5 text-sm"
                          />
                        </td>
                        <td className={`py-3.5 pr-4 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>
                          <div className="flex items-center gap-2">
                            <ProgressBar
                              value={tsk.progress}
                              size="sm"
                              className="w-16"
                              tone={tsk.progress >= 100 ? 'success' : tsk.progress >= 50 ? 'primary' : 'warning'}
                            />
                            <span className="tabular-nums text-xs text-ink-500">{tsk.progress}%</span>
                          </div>
                        </td>
                        <td className={`rounded-r-lg py-3.5 pr-4 shadow-sm transition group-hover:brightness-95 ${rowBg}`}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditTask(tsk)}
                              className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-surface-100/70 hover:text-primary-600"
                              aria-label="แก้ไข"
                              title="แก้ไข"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(tsk)}
                              className="rounded-md p-1.5 text-danger-500 transition-colors hover:bg-danger-50 hover:text-danger-600"
                              aria-label="ลบ"
                              title="ลบ"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {taskTable.paged.length === 0 && (
                    <tr>
                      <td colSpan={9}>
                        <EmptyState py="md">ไม่พบงานที่ตรงกับเงื่อนไข</EmptyState>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <TableFooter page={taskTable.page} pageSize={taskTable.pageSize} total={taskTable.total} onPageSizeChange={taskTable.setPageSize} />
          </Card>
        )}
      </div>

      <Modal
        open={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="แก้ไขงาน"
        description="แก้ไขรายละเอียดของงานนี้"
        icon={ListChecks}
        widthClassName="max-w-2xl"
        footer={
          <>
            <button type="button" onClick={() => setTaskModalOpen(false)} className={cancelBtnClass}>
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={() => void submitTaskEdit()}
              disabled={taskSubmitting || !taskForm.title.trim()}
              className={primaryBtnClass}
            >
              บันทึกการแก้ไข
            </button>
          </>
        }
      >
        <ErrorNote message={taskFormError} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={fieldLabelClass}>ชื่องาน</label>
            <input
              value={taskForm.title}
              onChange={(e) => setTaskForm((f) => ({ ...f, title: e.target.value }))}
              className={inputClass}
              autoFocus
            />
          </div>
          <div>
            <label className={fieldLabelClass}>ทีม</label>
            <DropdownSelect
              value={taskForm.team_id}
              label="ไม่มีทีม"
              fullWidth
              options={[
                { value: '', label: 'ไม่มีทีม' },
                ...teams.map((tm) => ({ value: tm.id, label: tm.name })),
              ]}
              onChange={(value) => setTaskForm((f) => ({ ...f, team_id: value }))}
            />
          </div>
          <div>
            <label className={fieldLabelClass}>ผู้รับผิดชอบ</label>
            <DropdownSelect
              value={taskForm.owner_id}
              label="ไม่มีผู้รับผิดชอบ"
              fullWidth
              options={[
                { value: '', label: 'ไม่มีผู้รับผิดชอบ' },
                ...members.map((m) => ({ value: m.id, label: m.name })),
              ]}
              onChange={(value) => setTaskForm((f) => ({ ...f, owner_id: value }))}
            />
          </div>
          <div>
            <label className={fieldLabelClass}>สถานะ</label>
            <DropdownSelect
              value={taskForm.status}
              label="status"
              fullWidth
              options={(['todo', 'doing', 'done', 'blocked'] as TaskStatus[]).map((s) => ({ value: s, label: s }))}
              onChange={(value) => setTaskForm((f) => ({ ...f, status: value }))}
            />
          </div>
          <div>
            <label className={fieldLabelClass}>ระดับความสำคัญ</label>
            <DropdownSelect
              value={taskForm.priority}
              label="priority"
              fullWidth
              options={(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((p) => ({ value: p, label: p }))}
              onChange={(value) => setTaskForm((f) => ({ ...f, priority: value }))}
            />
          </div>
          <div>
            <label className={fieldLabelClass}>กำหนดส่ง</label>
            <input
              type="date"
              value={taskForm.due_date}
              onChange={(e) => setTaskForm((f) => ({ ...f, due_date: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={fieldLabelClass}>ความคืบหน้า (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              value={taskForm.progress}
              onChange={(e) => setTaskForm((f) => ({ ...f, progress: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={fieldLabelClass}>Effort (วัน)</label>
            <input
              type="number"
              min={0}
              value={taskForm.effort_days}
              onChange={(e) => setTaskForm((f) => ({ ...f, effort_days: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="ลบงานนี้?"
        description={deleteTarget ? `งาน "${deleteTarget.title}" จะถูกลบออกอย่างถาวร ไม่สามารถย้อนกลับได้` : undefined}
        confirmLabel="ลบงาน"
        loading={deleting}
        onConfirm={() => void confirmDeleteTask()}
        onCancel={() => setDeleteTarget(null)}
      />
    </AsyncState>
  )
}
