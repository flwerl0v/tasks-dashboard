import { palette } from './colorPalette.js'
import type { TaskPriority, TaskStatus, WorkloadLevel } from '../types'

export const colors = palette

export const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: palette.primary[500],
  doing: palette.warning[500],
  done: palette.success[500],
  blocked: palette.danger[500],
}

export const STATUS_ORDER: TaskStatus[] = ['todo', 'doing', 'done', 'blocked']

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  doing: 'Doing',
  done: 'Done',
  blocked: 'Blocked',
}

/** Subtle per-status row tint for the "colored row" table style (Dashboard, Tasks list). */
export const STATUS_ROW_BG: Record<TaskStatus, string> = {
  todo: 'bg-primary-50/40',
  doing: 'bg-warning-50/40',
  done: 'bg-success-50/40',
  blocked: 'bg-danger-50/50',
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: palette.ink[400],
  medium: palette.warning[500],
  high: palette.danger[500],
  critical: palette.danger[700],
}

export const LEVEL_COLORS: Record<WorkloadLevel, string> = {
  overload: palette.danger[500],
  balanced: palette.success[500],
  underload: palette.warning[500],
}

/** Subtle per-level row tint for the "colored row" table style (Dashboard, Tasks list). */
export const LEVEL_ROW_BG: Record<WorkloadLevel, string> = {
  overload: 'bg-danger-50/50',
  balanced: 'bg-success-50/40',
  underload: 'bg-warning-50/40',
}

export const chartColors = {
  grid: palette.border.DEFAULT,
  cursor: palette.surface[100],
  referenceLine: palette.border[300],
  tick: palette.ink[500],
  tickStrong: palette.ink[700],
  brand: palette.primary[600],
}
