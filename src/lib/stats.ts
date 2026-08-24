import type { Task, TaskStatus, Team } from '../types'

export function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false
  return new Date(task.due_date) < new Date(new Date().toDateString())
}

export function isDueSoon(task: Task, withinDays = 3): boolean {
  if (!task.due_date || task.status === 'done') return false
  const due = new Date(task.due_date)
  const now = new Date(new Date().toDateString())
  const diffDays = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays >= 0 && diffDays <= withinDays
}

export function countByStatus(tasks: Task[]): Record<TaskStatus, number> {
  return {
    todo: tasks.filter((t) => t.status === 'todo').length,
    doing: tasks.filter((t) => t.status === 'doing').length,
    done: tasks.filter((t) => t.status === 'done').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
  }
}

export function countByTeam(tasks: Task[], teams: Team[]): Array<{ team: string; count: number }> {
  return teams
    .map((team) => ({ team: team.name, count: tasks.filter((t) => t.team_id === team.id).length }))
    .sort((a, b) => b.count - a.count)
}

export type TeamStatusBreakdown = { team: string; todo: number; doing: number; done: number; blocked: number; total: number }

export function countByTeamAndStatus(tasks: Task[], teams: Team[]): TeamStatusBreakdown[] {
  return teams
    .map((team) => {
      const teamTasks = tasks.filter((t) => t.team_id === team.id)
      return {
        team: team.name,
        todo: teamTasks.filter((t) => t.status === 'todo').length,
        doing: teamTasks.filter((t) => t.status === 'doing').length,
        done: teamTasks.filter((t) => t.status === 'done').length,
        blocked: teamTasks.filter((t) => t.status === 'blocked').length,
        total: teamTasks.length,
      }
    })
    .sort((a, b) => b.total - a.total)
}

/** Whole days elapsed since the given ISO date/timestamp (0 if in the future). */
export function daysSince(dateStr: string): number {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
}
