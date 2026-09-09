import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Clock, ListChecks, Pencil, Trash2, UserPlus, Users } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { AsyncState } from '../components/ui/AsyncState'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ActionMenu, type ActionMenuItem } from '../components/ui/ActionMenu'
import { MemberDetailModal } from '../components/members/MemberDetailModal'
import { StatusBadge, PriorityBadge } from '../components/ui/Badge'
import { Pagination } from '../components/ui/Pagination'
import { ProgressBar } from '../components/ui/ProgressBar'
import { EmptyState } from '../components/ui/EmptyState'
import { inputClass, fieldLabelClass, cancelBtnClass, primaryBtnClass, ErrorNote } from '../components/ui/formStyles'
import { SortHeader, TableToolbar, SelectionBar, TableFooter, TableHeadRow, TableBodyRow } from '../components/ui/tableParts'
import { useTableState } from '../lib/useTableState'
import { getTeamBadgeStyle } from '../lib/teamColor'
import { isOverdue } from '../lib/stats'
import { describeSupabaseError } from '../lib/errors'
import { useToast } from '../components/ui/ToastProvider'
import type { Member, Task, TaskPriority, TaskStatus } from '../types'

type DetailTab = 'overview' | 'tasks' | 'members'

const DETAIL_TABS: Array<{ key: DetailTab; label: string }> = [
  { key: 'overview', label: 'แนะนำทีม' },
  { key: 'tasks', label: 'งานของทีม' },
  { key: 'members', label: 'สมาชิก' },
]

const PRIORITY_ORDER: Record<TaskPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 }
const STATUS_ORDER: Record<TaskStatus, number> = { blocked: 0, doing: 1, todo: 2, done: 3 }

interface TaskFormState {
  title: string
  owner_id: string
  status: TaskStatus
  priority: TaskPriority
  due_date: string
  progress: string
  effort_days: string
}

const EMPTY_TASK_FORM: TaskFormState = {
  title: '',
  owner_id: '',
  status: 'todo',
  priority: 'medium',
  due_date: '',
  progress: '0',
  effort_days: '1',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function TeamDetail() {
  const { teamId } = useParams<{ teamId: string }>()
  const {
    teams,
    members,
    tasks,
    loading,
    error,
    updateTeam,
    deleteTeam,
    createMember,
    updateMember,
    deleteMember,
    createTask,
    updateTask,
    deleteTask,
  } = useAppData()
  const { showError } = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState<DetailTab>('overview')

  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [deleteTeamConfirmOpen, setDeleteTeamConfirmOpen] = useState(false)
  const [deletingTeam, setDeletingTeam] = useState(false)

  const [memberSearch, setMemberSearch] = useState('')
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null)
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [memberName, setMemberName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberFormError, setMemberFormError] = useState<string | null>(null)
  const [memberSubmitting, setMemberSubmitting] = useState(false)
  const [rowError, setRowError] = useState<string | null>(null)
  const [memberDeleteTarget, setMemberDeleteTarget] = useState<Member | null>(null)
  const [deletingMember, setDeletingMember] = useState(false)
  const [memberBulkDeleteOpen, setMemberBulkDeleteOpen] = useState(false)
  const [deletingMembersBulk, setDeletingMembersBulk] = useState(false)

  const [taskSearch, setTaskSearch] = useState('')
  const [taskRowError, setTaskRowError] = useState<string | null>(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [taskForm, setTaskForm] = useState<TaskFormState>(EMPTY_TASK_FORM)
  const [taskFormError, setTaskFormError] = useState<string | null>(null)
  const [taskSubmitting, setTaskSubmitting] = useState(false)
  const [taskDeleteTarget, setTaskDeleteTarget] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState(false)
  const [taskBulkDeleteOpen, setTaskBulkDeleteOpen] = useState(false)
  const [deletingTasksBulk, setDeletingTasksBulk] = useState(false)

  const team = useMemo(() => teams.find((tm) => tm.id === teamId), [teams, teamId])
  const teamMembers = useMemo(() => members.filter((m) => m.team_id === teamId), [members, teamId])
  const teamTasks = useMemo(() => tasks.filter((t) => t.team_id === teamId), [tasks, teamId])
  const memberById = useMemo(() => new Map(teamMembers.map((m) => [m.id, m])), [teamMembers])
  const taskCountByMember = useMemo(() => {
    const map = new Map<string, number>()
    tasks.forEach((t) => {
      if (!t.owner_id) return
      map.set(t.owner_id, (map.get(t.owner_id) ?? 0) + 1)
    })
    return map
  }, [tasks])

  const active = teamTasks.filter((t) => t.status !== 'done').length
  const overdue = teamTasks.filter(isOverdue).length

  const filteredTasks = useMemo(() => {
    const q = taskSearch.trim().toLowerCase()
    if (!q) return teamTasks
    return teamTasks.filter((tsk) => {
      const owner = memberById.get(tsk.owner_id ?? '')?.name.toLowerCase() ?? ''
      return tsk.title.toLowerCase().includes(q) || owner.includes(q)
    })
  }, [teamTasks, taskSearch, memberById])

  const getTaskSortValue = (task: Task, key: string) => {
    switch (key) {
      case 'owner':
        return memberById.get(task.owner_id ?? '')?.name.toLowerCase() ?? ''
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

  const taskTable = useTableState(filteredTasks, getTaskSortValue)
  const [searchParams] = useSearchParams()

  useEffect(() => {
    if (searchParams.get('newTask') === '1') {
      openCreateTask()
    }
  }, [searchParams])

  const filteredMembers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase()
    if (!q) return teamMembers
    return teamMembers.filter((m) => m.name.toLowerCase().includes(q) || (m.email ?? '').toLowerCase().includes(q))
  }, [teamMembers, memberSearch])

  const getMemberSortValue = (member: Member, key: string) => {
    if (key === 'email') return (member.email ?? '').toLowerCase()
    if (key === 'tasks') return taskCountByMember.get(member.id) ?? 0
    return member.name.toLowerCase()
  }

  const memberTable = useTableState(filteredMembers, getMemberSortValue)

  const openEdit = () => {
    if (!team) return
    setName(team.name)
    setCategory(team.category ?? '')
    setFormError(null)
    setEditOpen(true)
  }

  const submitEdit = async () => {
    if (!team) return
    const trimmed = name.trim()
    if (!trimmed) return
    setSubmitting(true)
    setFormError(null)
    try {
      await updateTeam(team.id, { name: trimmed, category: category.trim() || null })
      setEditOpen(false)
    } catch (err) {
      setFormError(describeSupabaseError(err, 'บันทึกทีมไม่สำเร็จ'))
    } finally {
      setSubmitting(false)
    }
  }

  const confirmRemoveTeam = async () => {
    if (!team) return
    setDeletingTeam(true)
    try {
      await deleteTeam(team.id)
      navigate('/admin')
    } catch (err) {
      showError(describeSupabaseError(err, 'ลบทีมไม่สำเร็จ'))
    } finally {
      setDeletingTeam(false)
    }
  }

  const openAddMember = () => {
    setEditingMemberId(null)
    setMemberName('')
    setMemberEmail('')
    setMemberFormError(null)
    setMemberModalOpen(true)
  }

  const openEditMember = (member: Member) => {
    setEditingMemberId(member.id)
    setMemberName(member.name)
    setMemberEmail(member.email ?? '')
    setMemberFormError(null)
    setMemberModalOpen(true)
  }

  const submitMember = async () => {
    if (!team) return
    const trimmed = memberName.trim()
    if (!trimmed) {
      setMemberFormError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }
    setMemberSubmitting(true)
    setMemberFormError(null)
    try {
      if (editingMemberId) await updateMember(editingMemberId, { name: trimmed, email: memberEmail.trim() || null })
      else await createMember({ name: trimmed, email: memberEmail.trim() || null, team_id: team.id })
      setMemberModalOpen(false)
    } catch (err) {
      setMemberFormError(describeSupabaseError(err, 'บันทึกสมาชิกไม่สำเร็จ'))
    } finally {
      setMemberSubmitting(false)
    }
  }

  const confirmRemoveMember = async () => {
    if (!memberDeleteTarget) return
    setDeletingMember(true)
    try {
      await deleteMember(memberDeleteTarget.id)
      setMemberDeleteTarget(null)
    } catch (err) {
      setRowError(describeSupabaseError(err, 'ลบสมาชิกไม่สำเร็จ'))
    } finally {
      setDeletingMember(false)
    }
  }

  const confirmBulkRemoveMembers = async () => {
    const ids = [...memberTable.selected]
    if (ids.length === 0) return
    setDeletingMembersBulk(true)
    try {
      for (const id of ids) await deleteMember(id)
      memberTable.clearSelection()
      setMemberBulkDeleteOpen(false)
    } catch (err) {
      setRowError(describeSupabaseError(err, 'ลบสมาชิกไม่สำเร็จ'))
    } finally {
      setDeletingMembersBulk(false)
    }
  }

  const openCreateTask = () => {
    setEditingTaskId(null)
    setTaskForm(EMPTY_TASK_FORM)
    setTaskFormError(null)
    setTaskModalOpen(true)
  }

  /** สถานะ ⇄ ความคืบหน้า ต้องสอดคล้องกันเสมอ: done กับ 100% คู่กัน, todo กับ 0% คู่กัน */
  const handleStatusChange = (status: TaskStatus) => {
    setTaskForm((f) => {
      if (status === 'done') return { ...f, status, progress: '100' }
      if (status === 'todo') return { ...f, status, progress: '0' }
      return { ...f, status }
    })
  }

  const handleProgressChange = (raw: string) => {
    setTaskForm((f) => {
      if (raw === '') return { ...f, progress: raw }
      const num = Math.max(0, Math.min(100, Number(raw)))
      if (Number.isNaN(num)) return { ...f, progress: raw }
      let status = f.status
      if (num >= 100) status = 'done'
      else if (num <= 0) status = 'todo'
      else if (f.status === 'todo' || f.status === 'done') status = 'doing'
      return { ...f, progress: raw, status }
    })
  }

  const openEditTask = (task: Task) => {
    setEditingTaskId(task.id)
    setTaskForm({
      title: task.title,
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

  const submitTask = async () => {
    if (!team) return
    const title = taskForm.title.trim()
    if (!title || !taskForm.owner_id) {
      setTaskFormError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }
    const progress = Math.max(0, Math.min(100, Number(taskForm.progress) || 0))
    const effort_days = Math.max(0, Number(taskForm.effort_days) || 0)
    const payload = {
      title,
      team_id: team.id,
      owner_id: taskForm.owner_id || null,
      status: taskForm.status,
      priority: taskForm.priority,
      due_date: taskForm.due_date || null,
      progress,
      effort_days,
    }
    setTaskSubmitting(true)
    setTaskFormError(null)
    try {
      if (editingTaskId) await updateTask(editingTaskId, payload)
      else await createTask(payload)
      setTaskModalOpen(false)
    } catch (err) {
      setTaskFormError(describeSupabaseError(err, 'บันทึกงานไม่สำเร็จ'))
    } finally {
      setTaskSubmitting(false)
    }
  }

  const confirmRemoveTask = async () => {
    if (!taskDeleteTarget) return
    setDeletingTask(true)
    try {
      await deleteTask(taskDeleteTarget.id)
      setTaskDeleteTarget(null)
    } catch (err) {
      setTaskRowError(describeSupabaseError(err, 'ลบงานไม่สำเร็จ'))
    } finally {
      setDeletingTask(false)
    }
  }

  const confirmBulkDeleteTasks = async () => {
    const ids = [...taskTable.selected]
    if (ids.length === 0) return
    setDeletingTasksBulk(true)
    try {
      for (const id of ids) await deleteTask(id)
      taskTable.clearSelection()
      setTaskBulkDeleteOpen(false)
    } catch (err) {
      setTaskRowError(describeSupabaseError(err, 'ลบงานไม่สำเร็จ'))
    } finally {
      setDeletingTasksBulk(false)
    }
  }

  if (!loading && !team) return <Navigate to="/admin" replace />

  const style = team ? getTeamBadgeStyle(team.id) : getTeamBadgeStyle(null)

  return (
    <AsyncState loading={loading} error={error}>
      {team && (
        <div className="space-y-4">
          <Link
            to="/admin"
            aria-label="กลับไปหน้าทีม"
            className="inline-flex items-center justify-center rounded-full border border-border bg-white p-2 text-ink-500 transition-colors hover:bg-surface-50 hover:text-ink-700"
          >
            <ArrowLeft size={16} />
          </Link>

          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
            <div className={`h-28 bg-gradient-to-r ${style.from} ${style.to}`} />
            <div className="px-6 pb-6">
              <div className="flex items-end justify-between gap-3">
                <span
                  className={`-mt-12 flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 border-white text-2xl font-bold text-white shadow-lg ${style.solid}`}
                >
                  {team.name.trim().slice(0, 1).toUpperCase()}
                </span>
                <div className="mb-1">
                  <ActionMenu
                    trigger="icon"
                    items={
                      [
                        { label: 'แก้ไขทีม', icon: Pencil, onClick: openEdit },
                        { label: 'ลบทีม', icon: Trash2, danger: true, onClick: () => setDeleteTeamConfirmOpen(true) },
                      ] satisfies ActionMenuItem[]
                    }
                  />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-ink-900 truncate">{team.name}</h2>
                  {team.category && (
                    <div className="mt-1">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${style.bg} ${style.text}`}>{team.category}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 items-center">
                  <div className="flex items-center gap-3 rounded-2xl border border-border-100 bg-surface-50 px-4 py-3 shadow-sm">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-200 text-ink-600">
                      <Users size={18} />
                    </span>
                    <div>
                      <p className="text-lg font-bold tabular-nums text-ink-800">{teamMembers.length}</p>
                      <p className="text-xs text-ink-400">สมาชิก</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-2xl border border-warning-100 bg-warning-50 px-4 py-3 shadow-sm">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-warning-100 text-warning-600">
                      <Clock size={18} />
                    </span>
                    <div>
                      <p className="text-lg font-bold tabular-nums text-warning-700">{active}</p>
                      <p className="text-xs text-warning-600/80">กำลังทำ</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 border-t border-border-100 px-6 py-3">
              <div className="flex gap-2">
                {DETAIL_TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTab(key)}
                    className={`py-2 px-3 text-sm font-medium transition ${
                      tab === key ? 'bg-primary-50 text-primary-600 rounded-full' : 'text-ink-500 hover:bg-surface-100 rounded-full'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {tab === 'overview' && (
            <Card title="เกี่ยวกับทีม">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-ink-400">หมวดหมู่</dt>
                  <dd className="mt-0.5 text-sm font-medium text-ink-700">{team.category ?? '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-400">สร้างเมื่อ</dt>
                  <dd className="mt-0.5 text-sm font-medium text-ink-700">{formatDate(team.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-400">งานทั้งหมด</dt>
                  <dd className="mt-0.5 text-sm font-medium text-ink-700">{teamTasks.length} งาน</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-400">งานเกินกำหนด</dt>
                  <dd className={`mt-0.5 text-sm font-medium ${overdue ? 'text-danger-600' : 'text-ink-700'}`}>{overdue} งาน</dd>
                </div>
              </dl>
            </Card>
          )}

          {tab === 'tasks' && (
            <Card>
              <TableToolbar search={taskSearch} onSearchChange={setTaskSearch} createLabel="เพิ่มงาน" onCreate={openCreateTask} />
              <SelectionBar count={taskTable.selected.size} onDelete={() => setTaskBulkDeleteOpen(true)} onClear={taskTable.clearSelection} />
              <ErrorNote message={taskRowError} />

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead>
                    <TableHeadRow shaded>
                      <th className="w-10 py-3 pl-4"></th>
                      <th className="py-3 pr-4 font-medium">
                        <SortHeader label="งาน" sortKey="title" activeKey={taskTable.sortKey} dir={taskTable.sortDir} onSort={taskTable.toggleSort} />
                      </th>
                      <th className="py-3 pr-4 font-medium">
                        <SortHeader label="ผู้รับผิดชอบ" sortKey="owner" activeKey={taskTable.sortKey} dir={taskTable.sortDir} onSort={taskTable.toggleSort} />
                      </th>
                      <th className="py-3 pr-4 font-medium">
                        <SortHeader label="สถานะ" sortKey="status" activeKey={taskTable.sortKey} dir={taskTable.sortDir} onSort={taskTable.toggleSort} />
                      </th>
                      <th className="py-3 pr-4 font-medium">
                        <SortHeader label="ความสำคัญ" sortKey="priority" activeKey={taskTable.sortKey} dir={taskTable.sortDir} onSort={taskTable.toggleSort} />
                      </th>
                      <th className="py-3 pr-4 font-medium">
                        <SortHeader label="กำหนดส่ง" sortKey="due_date" activeKey={taskTable.sortKey} dir={taskTable.sortDir} onSort={taskTable.toggleSort} />
                      </th>
                      <th className="py-3 pr-4 font-medium">
                        <SortHeader label="ความคืบหน้า" sortKey="progress" activeKey={taskTable.sortKey} dir={taskTable.sortDir} onSort={taskTable.toggleSort} />
                      </th>
                      <th className="py-3 pr-4 font-medium text-right">Action</th>
                    </TableHeadRow>
                  </thead>
                  <tbody>
                    {taskTable.paged.map((tsk) => (
                      <TableBodyRow key={tsk.id} hoverable>
                        <td className="py-3 pl-4">
                          <input
                            type="checkbox"
                            className="accent-primary-600"
                            checked={taskTable.selected.has(tsk.id)}
                            onChange={() => taskTable.toggleSelect(tsk.id)}
                          />
                        </td>
                        <td className="py-3 pr-4 font-medium text-ink-700">{tsk.title}</td>
                        <td className="py-3 pr-4 text-ink-500">{memberById.get(tsk.owner_id ?? '')?.name ?? '-'}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={tsk.status} />
                        </td>
                        <td className="py-3 pr-4">
                          <PriorityBadge priority={tsk.priority} />
                        </td>
                        <td className="py-3 pr-4 text-ink-500">{tsk.due_date ?? '-'}</td>
                        <td className="py-3 pr-4 text-ink-500">
                          <div className="flex items-center gap-2">
                            <ProgressBar value={tsk.progress} size="sm" className="w-14" />
                            <span className="text-xs tabular-nums">{tsk.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditTask(tsk)}
                              className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-surface-100 hover:text-primary-600"
                              aria-label="แก้ไข"
                              title="แก้ไข"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setTaskDeleteTarget(tsk)}
                              className="rounded-md p-1.5 text-danger-500 transition-colors hover:bg-danger-50 hover:text-danger-600"
                              aria-label="ลบ"
                              title="ลบ"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </TableBodyRow>
                    ))}
                    {taskTable.paged.length === 0 && (
                      <tr>
                        <td colSpan={8}>
                          <EmptyState py="lg">{taskSearch ? 'ไม่พบงานที่ตรงกับการค้นหา' : 'ทีมนี้ยังไม่มีงาน'}</EmptyState>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <TableFooter page={taskTable.page} pageSize={taskTable.pageSize} total={taskTable.total} onPageSizeChange={taskTable.setPageSize} />
              <Pagination page={taskTable.page} pageCount={taskTable.pageCount} onPageChange={taskTable.setPage} />
            </Card>
          )}

          {tab === 'members' && (
            <Card>
              <TableToolbar search={memberSearch} onSearchChange={setMemberSearch} createLabel="เพิ่มสมาชิก" onCreate={openAddMember} />
              <SelectionBar count={memberTable.selected.size} onDelete={() => setMemberBulkDeleteOpen(true)} onClear={memberTable.clearSelection} />
              <ErrorNote message={rowError} />

              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead>
                    <TableHeadRow shaded>
                      <th className="w-10 py-3 pl-4"></th>
                      <th className="py-3 pr-4 font-medium">
                        <SortHeader label="ชื่อ" sortKey="name" activeKey={memberTable.sortKey} dir={memberTable.sortDir} onSort={memberTable.toggleSort} />
                      </th>
                      <th className="py-3 pr-4 font-medium">
                        <SortHeader label="อีเมล" sortKey="email" activeKey={memberTable.sortKey} dir={memberTable.sortDir} onSort={memberTable.toggleSort} />
                      </th>
                      <th className="py-3 pr-4 font-medium">
                        <SortHeader label="งานที่ถือ" sortKey="tasks" activeKey={memberTable.sortKey} dir={memberTable.sortDir} onSort={memberTable.toggleSort} />
                      </th>
                      <th className="py-3 pr-4 font-medium text-right">Action</th>
                    </TableHeadRow>
                  </thead>
                  <tbody>
                    {memberTable.paged.map((member) => (
                      <TableBodyRow key={member.id} hoverable>
                        <td className="py-3 pl-4">
                          <input
                            type="checkbox"
                            className="accent-primary-600"
                            checked={memberTable.selected.has(member.id)}
                            onChange={() => memberTable.toggleSelect(member.id)}
                          />
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          <button
                            type="button"
                            onClick={() => setDetailMemberId(member.id)}
                            className="flex items-center gap-2.5 text-ink-700 hover:text-primary-600"
                          >
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-ink-600 ${getTeamBadgeStyle(member.id).bg}`}>
                              {member.name.trim().slice(0, 1).toUpperCase()}
                            </span>
                            <span className="hover:underline">{member.name}</span>
                          </button>
                        </td>
                        <td className="py-3 pr-4 text-ink-500">{member.email ?? '-'}</td>
                        <td className="py-3 pr-4 text-ink-500">{taskCountByMember.get(member.id) ?? 0}</td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEditMember(member)}
                              className="rounded-md p-1.5 text-ink-400 transition-colors hover:bg-surface-100 hover:text-primary-600"
                              aria-label="แก้ไข"
                              title="แก้ไข"
                            >
                              <Pencil size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setMemberDeleteTarget(member)}
                              className="rounded-md p-1.5 text-danger-500 transition-colors hover:bg-danger-50 hover:text-danger-600"
                              aria-label="ลบออกจากทีม"
                              title="ลบออกจากทีม"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </TableBodyRow>
                    ))}
                    {memberTable.paged.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          <EmptyState py="lg">{memberSearch ? 'ไม่พบสมาชิกที่ตรงกับการค้นหา' : 'ทีมนี้ยังไม่มีสมาชิก'}</EmptyState>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <TableFooter page={memberTable.page} pageSize={memberTable.pageSize} total={memberTable.total} onPageSizeChange={memberTable.setPageSize} />
              <Pagination page={memberTable.page} pageCount={memberTable.pageCount} onPageChange={memberTable.setPage} />
            </Card>
          )}

          <Modal
            open={editOpen}
            onClose={() => setEditOpen(false)}
            title="แก้ไขทีม"
            description="แก้ไขชื่อและหมวดหมู่ของทีมนี้"
            icon={Users}
            footer={
              <>
                <button type="button" onClick={() => setEditOpen(false)} className={cancelBtnClass}>
                  ยกเลิก
                </button>
                <button type="button" onClick={() => void submitEdit()} disabled={submitting || !name.trim()} className={primaryBtnClass}>
                  บันทึก
                </button>
              </>
            }
          >
            <ErrorNote message={formError} />
            <div className="space-y-3">
              <div>
                <label className={fieldLabelClass}>ชื่อทีม</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} autoFocus />
              </div>
              <div>
                <label className={fieldLabelClass}>หมวดหมู่ (ไม่บังคับ)</label>
                <input value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} />
              </div>
            </div>
          </Modal>

          <Modal
            open={memberModalOpen}
            onClose={() => setMemberModalOpen(false)}
            title={editingMemberId ? 'แก้ไขสมาชิก' : `เพิ่มสมาชิกในทีม ${team.name}`}
            description={editingMemberId ? 'แก้ไขชื่อและอีเมลของสมาชิกนี้' : 'สมาชิกใหม่จะถูกเพิ่มเข้าทีมนี้ทันที'}
            icon={UserPlus}
            footer={
              <>
                <button type="button" onClick={() => setMemberModalOpen(false)} className={cancelBtnClass}>
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => void submitMember()}
                  disabled={memberSubmitting}
                  className={primaryBtnClass}
                >
                  {editingMemberId ? 'บันทึกการแก้ไข' : 'เพิ่มสมาชิก'}
                </button>
              </>
            }
          >
            <ErrorNote message={memberFormError} />
            <div className="space-y-3">
              <div>
                <label className={fieldLabelClass}>ชื่อสมาชิก</label>
                <input
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && void submitMember()}
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div>
                <label className={fieldLabelClass}>อีเมล (ไม่บังคับ)</label>
                <input value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} className={inputClass} />
              </div>
            </div>
          </Modal>

          <Modal
            open={taskModalOpen}
            onClose={() => setTaskModalOpen(false)}
            title={editingTaskId ? 'แก้ไขงาน' : 'เพิ่มงานใหม่'}
            description={editingTaskId ? 'แก้ไขรายละเอียดของงานนี้' : `สร้างงานใหม่ในทีม ${team.name}`}
            icon={ListChecks}
            widthClassName="max-w-2xl"
            footer={
              <>
                <button type="button" onClick={() => setTaskModalOpen(false)} className={cancelBtnClass}>
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => void submitTask()}
                  disabled={taskSubmitting}
                  className={primaryBtnClass}
                >
                  {editingTaskId ? 'บันทึกการแก้ไข' : 'เพิ่มงาน'}
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
                <label className={fieldLabelClass}>ผู้รับผิดชอบ</label>
                <select
                  value={taskForm.owner_id}
                  onChange={(e) => setTaskForm((f) => ({ ...f, owner_id: e.target.value }))}
                  className={inputClass}
                >
                  <option value="">-- เลือกผู้รับผิดชอบ --</option>
                  {teamMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fieldLabelClass}>สถานะ</label>
                <select
                  value={taskForm.status}
                  onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                  className={inputClass}
                >
                  {(['todo', 'doing', 'done', 'blocked'] as TaskStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={fieldLabelClass}>ระดับความสำคัญ</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
                  className={inputClass}
                >
                  {(['low', 'medium', 'high', 'critical'] as TaskPriority[]).map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
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
                  onChange={(e) => handleProgressChange(e.target.value)}
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

          <MemberDetailModal memberId={detailMemberId} onClose={() => setDetailMemberId(null)} />

          <ConfirmDialog
            open={deleteTeamConfirmOpen}
            title={`ลบทีม "${team.name}"?`}
            description={
              teamMembers.length || teamTasks.length
                ? `สมาชิก ${teamMembers.length} คน และงาน ${teamTasks.length} งาน ในทีมนี้จะกลายเป็น "ไม่มีทีม"`
                : 'การลบทีมนี้ไม่สามารถย้อนกลับได้'
            }
            confirmLabel="ลบทีม"
            loading={deletingTeam}
            onConfirm={() => void confirmRemoveTeam()}
            onCancel={() => setDeleteTeamConfirmOpen(false)}
          />

          <ConfirmDialog
            open={!!memberDeleteTarget}
            title={memberDeleteTarget ? `ลบสมาชิก "${memberDeleteTarget.name}" ออกจากทีม?` : ''}
            description={
              memberDeleteTarget && (taskCountByMember.get(memberDeleteTarget.id) ?? 0) > 0
                ? `งาน ${taskCountByMember.get(memberDeleteTarget.id)} งานที่มอบหมายให้จะกลายเป็น "ไม่มีผู้รับผิดชอบ"`
                : undefined
            }
            confirmLabel="ลบสมาชิก"
            loading={deletingMember}
            onConfirm={() => void confirmRemoveMember()}
            onCancel={() => setMemberDeleteTarget(null)}
          />

          <ConfirmDialog
            open={memberBulkDeleteOpen}
            title={`ลบสมาชิกที่เลือก ${memberTable.selected.size} คน ออกจากทีม?`}
            description={
              [...memberTable.selected].reduce((sum, id) => sum + (taskCountByMember.get(id) ?? 0), 0) > 0
                ? `งาน ${[...memberTable.selected].reduce((sum, id) => sum + (taskCountByMember.get(id) ?? 0), 0)} งานที่มอบหมายให้จะกลายเป็น "ไม่มีผู้รับผิดชอบ"`
                : undefined
            }
            confirmLabel="ลบสมาชิก"
            loading={deletingMembersBulk}
            onConfirm={() => void confirmBulkRemoveMembers()}
            onCancel={() => setMemberBulkDeleteOpen(false)}
          />

          <ConfirmDialog
            open={!!taskDeleteTarget}
            title={taskDeleteTarget ? `ลบงาน "${taskDeleteTarget.title}"?` : ''}
            description="การลบงานนี้ไม่สามารถย้อนกลับได้"
            confirmLabel="ลบงาน"
            loading={deletingTask}
            onConfirm={() => void confirmRemoveTask()}
            onCancel={() => setTaskDeleteTarget(null)}
          />

          <ConfirmDialog
            open={taskBulkDeleteOpen}
            title={`ลบงานที่เลือก ${taskTable.selected.size} งาน?`}
            description="การลบงานเหล่านี้ไม่สามารถย้อนกลับได้"
            confirmLabel="ลบงาน"
            loading={deletingTasksBulk}
            onConfirm={() => void confirmBulkDeleteTasks()}
            onCancel={() => setTaskBulkDeleteOpen(false)}
          />
        </div>
      )}
    </AsyncState>
  )
}
