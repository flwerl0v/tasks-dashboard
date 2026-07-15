import type { TaskPriority, TaskStatus, WorkloadLevel } from '../../types'

const STATUS_STYLES: Record<TaskStatus, string> = {
  todo: 'bg-slate-100 text-slate-600',
  doing: 'bg-blue-100 text-blue-700',
  done: 'bg-emerald-100 text-emerald-700',
  blocked: 'bg-rose-100 text-rose-700',
}

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  doing: 'Doing',
  done: 'Done',
  blocked: 'Blocked',
}

const PRIORITY_STYLES: Record<TaskPriority, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-rose-100 text-rose-700',
  critical: 'bg-rose-600 text-white',
}

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
}

const WORKLOAD_STYLES: Record<WorkloadLevel, string> = {
  overload: 'bg-rose-100 text-rose-700',
  balanced: 'bg-emerald-100 text-emerald-700',
  underload: 'bg-amber-100 text-amber-700',
}

const WORKLOAD_LABELS: Record<WorkloadLevel, string> = {
  overload: 'เยอะเกิน',
  balanced: 'พอดี',
  underload: 'น้อยเกิน',
}

function Pill({ className, children }: { className: string; children: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{children}</span>
  )
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Pill className={STATUS_STYLES[status]}>{STATUS_LABELS[status]}</Pill>
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Pill className={PRIORITY_STYLES[priority]}>{PRIORITY_LABELS[priority]}</Pill>
}

export function WorkloadBadge({ level }: { level: WorkloadLevel }) {
  return <Pill className={WORKLOAD_STYLES[level]}>{WORKLOAD_LABELS[level]}</Pill>
}
