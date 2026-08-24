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

export const chartColors = {
  grid: palette.border.DEFAULT,
  cursor: palette.surface[100],
  referenceLine: palette.border[300],
  tick: palette.ink[500],
  tickStrong: palette.ink[700],
  brand: palette.primary[600],
}
