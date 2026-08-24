import type { ReactNode } from 'react'
import { CheckCircle2, CircleDashed, Clock, Flag, XCircle } from 'lucide-react'
import type { TaskPriority, TaskStatus, WorkloadLevel } from '../../types'

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
