import { useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, ListChecks, Pencil, Trash2, UserPlus, Users } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { AsyncState } from '../components/ui/AsyncState'
import { Card } from '../components/ui/Card'
import { Modal } from '../components/ui/Modal'
import { ActionMenu, type ActionMenuItem } from '../components/ui/ActionMenu'
import { MemberDetailModal } from '../components/members/MemberDetailModal'
import { StatusBadge, PriorityBadge } from '../components/ui/Badge'
import { Pagination } from '../components/ui/Pagination'
import { inputClass, fieldLabelClass, cancelBtnClass, primaryBtnClass, ErrorNote } from '../components/ui/formStyles'
import { SortHeader, TableToolbar, SelectionBar, TableFooter } from '../components/ui/tableParts'
import { useTableState } from '../lib/useTableState'
import { getTeamBadgeStyle } from '../lib/teamColor'
import { isOverdue } from '../lib/stats'
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
    deleteMember,
    createTask,
    updateTask,
    deleteTask,
  } = useAppData()
  const navigate = useNavigate()
  const [tab, setTab] = useState<DetailTab>('overview')

  const [editOpen, setEditOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [memberSearch, setMemberSearch] = useState('')
  const [detailMemberId, setDetailMemberId] = useState<string | null>(null)
  const [memberModalOpen, setMemberModalOpen] = useState(false)
  const [memberName, setMemberName] = useState('')
  const [memberEmail, setMemberEmail] = useState('')
  const [memberFormError, setMemberFormError] = useState<string | null>(null)
  const [memberSubmitting, setMemberSubmitting] = useState(false)
  const [rowError, setRowError] = useState<string | null>(null)

  const [taskSearch, setTaskSearch] = useState('')
  const [taskRowError, setTaskRowError] = useState<string | null>(null)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [taskForm, setTaskForm] = useState<TaskFormState>(EMPTY_TASK_FORM)
  const [taskFormError, setTaskFormError] = useState<string | null>(null)
  const [taskSubmitting, setTaskSubmitting] = useState(false)

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
      setFormError(err instanceof Error ? err.message : 'บันทึกทีมไม่สำเร็จ')
    } finally {
      setSubmitting(false)
    }
  }

  const removeTeam = async () => {
    if (!team) return
    const confirmed = window.confirm(
      `ลบทีม "${team.name}"?${
        teamMembers.length || teamTasks.length
          ? ` สมาชิก ${teamMembers.length} คน และงาน ${teamTasks.length} งาน ในทีมนี้จะกลายเป็น "ไม่มีทีม"`
          : ''
      }`,
    )
    if (!confirmed) return
    await deleteTeam(team.id)
    navigate('/admin')
  }

  const openAddMember = () => {
    setMemberName('')
    setMemberEmail('')
    setMemberFormError(null)
    setMemberModalOpen(true)
  }

  const submitMember = async () => {
    if (!team) return
    const trimmed = memberName.trim()
    if (!trimmed) return
    setMemberSubmitting(true)
    setMemberFormError(null)
    try {
      await createMember({ name: trimmed, email: memberEmail.trim() || null, team_id: team.id })
      setMemberModalOpen(false)
    } catch (err) {
      setMemberFormError(err instanceof Error ? err.message : 'เพิ่มสมาชิกไม่สำเร็จ')
    } finally {
      setMemberSubmitting(false)
    }
  }

  const removeMember = async (member: Member) => {
    const taskCount = taskCountByMember.get(member.id) ?? 0
    const confirmed = window.confirm(
      `ลบสมาชิก "${member.name}" ออกจากทีม?${taskCount ? ` งาน ${taskCount} งานที่มอบหมายให้จะกลายเป็น "ไม่มีผู้รับผิดชอบ"` : ''}`,
    )
    if (!confirmed) return
    try {
      await deleteMember(member.id)
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'ลบสมาชิกไม่สำเร็จ')
    }
  }

  const bulkRemoveMembers = async () => {
    const ids = [...memberTable.selected]
    if (ids.length === 0) return
    const affectedTasks = ids.reduce((sum, id) => sum + (taskCountByMember.get(id) ?? 0), 0)
    const confirmed = window.confirm(
      `ลบสมาชิกที่เลือก ${ids.length} คน ออกจากทีม?${
        affectedTasks ? ` งาน ${affectedTasks} งานที่มอบหมายให้จะกลายเป็น "ไม่มีผู้รับผิดชอบ"` : ''
      }`,
    )
    if (!confirmed) return
    try {
      for (const id of ids) await deleteMember(id)
      memberTable.clearSelection()
    } catch (err) {
      setRowError(err instanceof Error ? err.message : 'ลบสมาชิกไม่สำเร็จ')
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
    if (!title) return
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
      setTaskFormError(err instanceof Error ? err.message : 'บันทึกงานไม่สำเร็จ')
    } finally {
      setTaskSubmitting(false)
    }
  }

  const removeTask = async (task: Task) => {
    const confirmed = window.confirm(`ลบงาน "${task.title}"?`)
    if (!confirmed) return
    try {
      await deleteTask(task.id)
    } catch (err) {
      setTaskRowError(err instanceof Error ? err.message : 'ลบงานไม่สำเร็จ')
    }
  }

  const bulkDeleteTasks = async () => {
    const ids = [...taskTable.selected]
    if (ids.length === 0) return
    const confirmed = window.confirm(`ลบงานที่เลือก ${ids.length} งาน?`)
    if (!confirmed) return
    try {
      for (const id of ids) await deleteTask(id)
      taskTable.clearSelection()
    } catch (err) {
      setTaskRowError(err instanceof Error ? err.message : 'ลบงานไม่สำเร็จ')
    }
  }

  if (!loading && !team) return <Navigate to="/admin" replace />

  const style = team ? getTeamBadgeStyle(team.id) : getTeamBadgeStyle(null)

  return (
    <AsyncState loading={loading} error={error}>
      {team && (
        <div className="space-y-4">
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-700">
            <ArrowLeft size={15} />
            กลับไปหน้าทีม
          </Link>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className={`h-24 bg-gradient-to-r ${style.from} ${style.to}`} />
            <div className="px-6 pb-5">
              <div className="flex items-end justify-between gap-3">
                <span
                  className={`-mt-8 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border-4 border-white text-xl font-bold text-white shadow-sm ${style.solid}`}
                >
                  {team.name.trim().slice(0, 1).toUpperCase()}
                </span>
                <div className="mb-1">
                  <ActionMenu
                    trigger="icon"
                    items={
                      [
                        { label: 'แก้ไขทีม', icon: Pencil, onClick: openEdit },
                        { label: 'ลบทีม', icon: Trash2, danger: true, onClick: () => void removeTeam() },
                      ] satisfies ActionMenuItem[]
                    }
                  />
                </div>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{team.name}</h2>
                {team.category && (
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${style.text}`}>{team.category}</span>
                )}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-200 text-slate-600">
                    <Users size={16} />
                  </span>
                  <div>
                    <p className="text-lg font-bold tabular-nums text-slate-800">{teamMembers.length}</p>
                    <p className="text-xs text-slate-400">สมาชิก</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <Clock size={16} />
                  </span>
                  <div>
                    <p className="text-lg font-bold tabular-nums text-amber-700">{active}</p>
                    <p className="text-xs text-amber-600/80">กำลังทำ</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 border-t border-slate-100 px-6">
              {DETAIL_TABS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key)}
                  className={`border-b-2 py-3 text-sm font-medium transition-colors ${
                    tab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {tab === 'overview' && (
            <Card title="เกี่ยวกับทีม">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-slate-400">หมวดหมู่</dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-700">{team.category ?? '-'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">สร้างเมื่อ</dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-700">{formatDate(team.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">งานทั้งหมด</dt>
                  <dd className="mt-0.5 text-sm font-medium text-slate-700">{teamTasks.length} งาน</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400">งานเกินกำหนด</dt>
                  <dd className={`mt-0.5 text-sm font-medium ${overdue ? 'text-rose-600' : 'text-slate-700'}`}>{overdue} งาน</dd>
                </div>
              </dl>
            </Card>
          )}

          {tab === 'tasks' && (
            <Card>
              <TableToolbar search={taskSearch} onSearchChange={setTaskSearch} createLabel="เพิ่มงาน" onCreate={openCreateTask} />
              <SelectionBar count={taskTable.selected.size} onDelete={() => void bulkDeleteTasks()} onClear={taskTable.clearSelection} />
              <ErrorNote message={taskRowError} />

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-400">
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
                    </tr>
                  </thead>
                  <tbody>
                    {taskTable.paged.map((tsk) => (
                      <tr key={tsk.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                        <td className="py-3 pl-4">
                          <input
                            type="checkbox"
                            className="accent-blue-600"
                            checked={taskTable.selected.has(tsk.id)}
                            onChange={() => taskTable.toggleSelect(tsk.id)}
                          />
                        </td>
                        <td className="py-3 pr-4 font-medium text-slate-700">{tsk.title}</td>
                        <td className="py-3 pr-4 text-slate-500">{memberById.get(tsk.owner_id ?? '')?.name ?? '-'}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge status={tsk.status} />
                        </td>
                        <td className="py-3 pr-4">
                          <PriorityBadge priority={tsk.priority} />
                        </td>
                        <td className="py-3 pr-4 text-slate-500">{tsk.due_date ?? '-'}</td>
                        <td className="py-3 pr-4 text-slate-500">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full bg-blue-500" style={{ width: `${tsk.progress}%` }} />
                            </div>
                            <span className="text-xs tabular-nums">{tsk.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right">
                          <ActionMenu
                            items={
                              [
                                { label: 'แก้ไข', icon: Pencil, onClick: () => openEditTask(tsk) },
                                { label: 'ลบ', icon: Trash2, danger: true, onClick: () => void removeTask(tsk) },
                              ] satisfies ActionMenuItem[]
                            }
                          />
                        </td>
                      </tr>
                    ))}
                    {taskTable.paged.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-slate-400">
                          {taskSearch ? 'ไม่พบงานที่ตรงกับการค้นหา' : 'ทีมนี้ยังไม่มีงาน'}
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
              <SelectionBar count={memberTable.selected.size} onDelete={() => void bulkRemoveMembers()} onClear={memberTable.clearSelection} />
              <ErrorNote message={rowError} />

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-xs text-slate-400">
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
                    </tr>
                  </thead>
                  <tbody>
                    {memberTable.paged.map((member) => (
                      <tr key={member.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                        <td className="py-3 pl-4">
                          <input
                            type="checkbox"
                            className="accent-blue-600"
                            checked={memberTable.selected.has(member.id)}
                            onChange={() => memberTable.toggleSelect(member.id)}
                          />
                        </td>
                        <td className="py-3 pr-4 font-medium">
                          <button
                            type="button"
                            onClick={() => setDetailMemberId(member.id)}
                            className="flex items-center gap-2.5 text-slate-700 hover:text-blue-600"
                          >
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-slate-600 ${getTeamBadgeStyle(member.id).bg}`}>
                              {member.name.trim().slice(0, 1).toUpperCase()}
                            </span>
                            <span className="hover:underline">{member.name}</span>
                          </button>
                        </td>
                        <td className="py-3 pr-4 text-slate-500">{member.email ?? '-'}</td>
                        <td className="py-3 pr-4 text-slate-500">{taskCountByMember.get(member.id) ?? 0}</td>
                        <td className="py-3 pr-4 text-right">
                          <ActionMenu
                            items={
                              [{ label: 'ลบออกจากทีม', icon: Trash2, danger: true, onClick: () => void removeMember(member) }] satisfies ActionMenuItem[]
                            }
                          />
                        </td>
                      </tr>
                    ))}
                    {memberTable.paged.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-slate-400">
                          {memberSearch ? 'ไม่พบสมาชิกที่ตรงกับการค้นหา' : 'ทีมนี้ยังไม่มีสมาชิก'}
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
            title={`เพิ่มสมาชิกในทีม ${team.name}`}
            description="สมาชิกใหม่จะถูกเพิ่มเข้าทีมนี้ทันที"
            icon={UserPlus}
            footer={
              <>
                <button type="button" onClick={() => setMemberModalOpen(false)} className={cancelBtnClass}>
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => void submitMember()}
                  disabled={memberSubmitting || !memberName.trim()}
                  className={primaryBtnClass}
                >
                  เพิ่มสมาชิก
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
                  disabled={taskSubmitting || !taskForm.title.trim()}
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
                  <option value="">ไม่มีผู้รับผิดชอบ</option>
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
        </div>
      )}
    </AsyncState>
  )
}
