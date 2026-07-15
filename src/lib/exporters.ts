import * as XLSX from 'xlsx'
import type { Member, MemberWorkload, Task, Team } from '../types'

function flattenTasks(tasks: Task[], teams: Team[], members: Member[]) {
  const teamById = new Map(teams.map((t) => [t.id, t]))
  const memberById = new Map(members.map((m) => [m.id, m]))
  return tasks.map((tsk) => ({
    task: tsk.title,
    team: teamById.get(tsk.team_id ?? '')?.name ?? '',
    member: memberById.get(tsk.owner_id ?? '')?.name ?? '',
    status: tsk.status,
    priority: tsk.priority,
    due_date: tsk.due_date ?? '',
    progress: tsk.progress,
    effort_days: tsk.effort_days,
  }))
}

/** Exports a multi-sheet Excel workbook: Tasks, Workload (AI), and Team summary. */
export function exportSummaryXlsx(tasks: Task[], teams: Team[], members: Member[], workloads: MemberWorkload[]) {
  const wb = XLSX.utils.book_new()

  const tasksSheet = XLSX.utils.json_to_sheet(flattenTasks(tasks, teams, members))
  XLSX.utils.book_append_sheet(wb, tasksSheet, 'Tasks')

  const workloadSheet = XLSX.utils.json_to_sheet(
    workloads.map((w) => ({
      member: w.member.name,
      open_tasks: w.openTaskCount,
      effort_days: w.totalEffortDays,
      overdue: w.overdueCount,
      ai_level: w.level,
      reason: w.reason,
    })),
  )
  XLSX.utils.book_append_sheet(wb, workloadSheet, 'Workload (AI)')

  const teamSheet = XLSX.utils.json_to_sheet(
    teams.map((team) => {
      const teamTasks = tasks.filter((tsk) => tsk.team_id === team.id)
      return {
        team: team.name,
        members: members.filter((m) => m.team_id === team.id).length,
        total_tasks: teamTasks.length,
        done: teamTasks.filter((tsk) => tsk.status === 'done').length,
        doing: teamTasks.filter((tsk) => tsk.status === 'doing').length,
        todo: teamTasks.filter((tsk) => tsk.status === 'todo').length,
        blocked: teamTasks.filter((tsk) => tsk.status === 'blocked').length,
      }
    }),
  )
  XLSX.utils.book_append_sheet(wb, teamSheet, 'Team Summary')

  XLSX.writeFile(wb, 'task_dashboard_summary.xlsx')
}
