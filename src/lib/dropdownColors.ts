import type { TaskPriority, TaskStatus } from '../types'

/**
 * Status/priority color-coding for <DropdownSelect> options — same palette as the
 * StatusBadge/PriorityFlag pills, split out into its own module (rather than living in
 * Badge.tsx) since react-refresh requires component files to only export components.
 */

const STATUS_DOT: Record<TaskStatus, string> = {
  todo: 'bg-primary-500',
  doing: 'bg-warning-500',
  done: 'bg-success-500',
  blocked: 'bg-danger-500',
}

const STATUS_TEXT: Record<TaskStatus, string> = {
  todo: 'text-primary-700',
  doing: 'text-warning-700',
  done: 'text-success-700',
  blocked: 'text-danger-700',
}

/** Dot + accent-text color for a status option in a <DropdownSelect> — same palette as StatusBadge. */
export function statusDropdownOption(status: TaskStatus): { dotClassName: string; accentClassName: string } {
  return { dotClassName: STATUS_DOT[status], accentClassName: STATUS_TEXT[status] }
}

const PRIORITY_DOT: Record<TaskPriority, string> = {
  low: 'bg-ink-300',
  medium: 'bg-warning-500',
  high: 'bg-danger-500',
  critical: 'bg-danger-700',
}

const PRIORITY_TEXT: Record<TaskPriority, string> = {
  low: 'text-ink-400',
  medium: 'text-warning-600',
  high: 'text-danger-600',
  critical: 'text-danger-700',
}

/** Dot + accent-text color for a priority option in a <DropdownSelect> — same palette as PriorityFlag. */
export function priorityDropdownOption(priority: TaskPriority): { dotClassName: string; accentClassName: string } {
  return { dotClassName: PRIORITY_DOT[priority], accentClassName: PRIORITY_TEXT[priority] }
}
