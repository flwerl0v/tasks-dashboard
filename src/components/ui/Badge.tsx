import type { ReactNode } from 'react'
import { AlertOctagon, CheckCircle2, CircleDashed, Clock, Flag, XCircle } from 'lucide-react'
import type { Task, TaskPriority, TaskStatus, WorkloadLevel } from '../../types'
import { isOverdue } from '../../lib/stats'
import { formatDueDate } from '../../lib/format'

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: 'bg-primary-100 text-primary-700',
  doing: 'bg-warning-100 text-warning-700',
  done: 'bg-success-100 text-success-700',
  blocked: 'bg-danger-100 text-danger-700',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  doing: 'Doing',
  done: 'Done',
  blocked: 'Blocked',
}

const STATUS_ICONS: Record<TaskStatus, typeof CheckCircle2> = {
  todo: CircleDashed,
  doing: Clock,
  done: CheckCircle2,
  blocked: XCircle,
}

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: 'bg-surface-100 text-ink-600',
  medium: 'bg-warning-100 text-warning-700',
  high: 'bg-danger-100 text-danger-700',
  critical: 'bg-danger-600 text-white',
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

const PRIORITY_FLAG_COLORS: Record<TaskPriority, string> = {
  low: 'text-ink-400',
  medium: 'text-warning-600',
  high: 'text-danger-600',
  critical: 'text-danger-700',
}

const WORKLOAD_STYLES: Record<WorkloadLevel, string> = {
  overload: 'bg-danger-100 text-danger-700',
  balanced: 'bg-success-100 text-success-700',
  underload: 'bg-warning-100 text-warning-700',
}

const WORKLOAD_LABELS: Record<WorkloadLevel, string> = {
  overload: 'เยอะเกิน',
  balanced: 'พอดี',
  underload: 'น้อยเกิน',
}

const DUE_DATE_STYLES: Record<TaskStatus, string> = {
  todo: 'border-primary-100 bg-primary-50 text-primary-700',
  doing: 'border-warning-100 bg-warning-50 text-warning-700',
  done: 'border-success-100 bg-success-50 text-success-700',
  blocked: 'border-danger-100 bg-danger-50 text-danger-600',
}

const DUE_DATE_ICONS: Record<TaskStatus, typeof CheckCircle2> = {
  todo: CircleDashed,
  doing: Clock,
  done: CheckCircle2,
  blocked: XCircle,
}

function Pill({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{children}</span>
  )
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const Icon = STATUS_ICONS[status]
  return (
    <Pill className={STATUS_STYLES[status]}>
      <Icon size={12} />
      {STATUS_LABELS[status]}
    </Pill>
  )
}

/**
 * Due-date chip: overdue always wins (danger, regardless of status) since a missed
 * deadline is the most urgent thing to flag; otherwise the color/icon follow the
 * task's own status so todo/doing/done/blocked read apart at a glance, not just
 * "overdue vs not."
 */
export function DueDateChip({ task }: { task: Task }) {
  const overdue = isOverdue(task)
  const className = overdue ? 'border-danger-200 bg-danger-100 text-danger-700' : DUE_DATE_STYLES[task.status]
  const Icon = overdue ? AlertOctagon : DUE_DATE_ICONS[task.status]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-xs font-medium ${className}`}>
      <Icon size={13} />
      {formatDueDate(task.due_date)}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Pill className={PRIORITY_STYLES[priority]}>{PRIORITY_LABELS[priority]}</Pill>
}

/** Compact icon + colored-text priority indicator for dense table rows (no filled pill). */
export function PriorityFlag({ priority }: { priority: TaskPriority }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${PRIORITY_FLAG_COLORS[priority]}`}>
      <Flag size={12} className={`fill-current ${priority === 'critical' ? 'animate-pulse' : ''}`} />
      {PRIORITY_LABELS[priority]}
    </span>
  )
}

export function WorkloadBadge({ level }: { level: WorkloadLevel }) {
  return <Pill className={WORKLOAD_STYLES[level]}>{WORKLOAD_LABELS[level]}</Pill>
}
