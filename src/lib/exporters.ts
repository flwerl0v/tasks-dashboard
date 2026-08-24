import ExcelJS from 'exceljs'
import type { Member, MemberWorkload, Task, Team } from '../types'
import type { CapturedChart } from './chartCapture'

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

function addDataSheet(wb: ExcelJS.Workbook, name: string, rows: Array<Record<string, string | number>>) {
  const sheet = wb.addWorksheet(name)
  if (rows.length === 0) return
  sheet.columns = Object.keys(rows[0]).map((key) => ({ header: key, key, width: Math.max(12, key.length + 4) }))
  sheet.addRows(rows)
  sheet.getRow(1).font = { bold: true }
}

function addChartSheet(wb: ExcelJS.Workbook, charts: CapturedChart[]) {
  const sheet = wb.addWorksheet('Charts')
  const ROW_HEIGHT_PX = 20
  let cursorRow = 1

  for (const chart of charts) {
    sheet.getCell(`A${cursorRow}`).value = chart.title
    sheet.getCell(`A${cursorRow}`).font = { bold: true, size: 12 }
    cursorRow += 1

    // captured at 2x scale for sharpness — halve back down for a reasonably sized cell image
    const displayWidth = chart.width / 2
    const displayHeight = chart.height / 2
    const imageId = wb.addImage({ base64: chart.dataUrl, extension: 'png' })
    sheet.addImage(imageId, { tl: { col: 0, row: cursorRow - 1 }, ext: { width: displayWidth, height: displayHeight } })

    cursorRow += Math.ceil(displayHeight / ROW_HEIGHT_PX) + 2
  }
}

function downloadWorkbook(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/** Exports a multi-sheet Excel workbook: Tasks, Workload (AI), Team summary, and (if provided) chart snapshots. */
export async function exportSummaryXlsx(
  tasks: Task[],
  teams: Team[],
  members: Member[],
  workloads: MemberWorkload[],
  charts: CapturedChart[] = [],
) {
  const wb = new ExcelJS.Workbook()

  addDataSheet(wb, 'Tasks', flattenTasks(tasks, teams, members))

  addDataSheet(
    wb,
    'Workload (AI)',
    workloads.map((w) => ({
      member: w.member.name,
      open_tasks: w.openTaskCount,
      effort_days: w.totalEffortDays,
      overdue: w.overdueCount,
      ai_level: w.level,
      reason: w.reason,
    })),
  )

  addDataSheet(
    wb,
    'Team Summary',
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

  if (charts.length > 0) addChartSheet(wb, charts)

  const buffer = await wb.xlsx.writeBuffer()
  downloadWorkbook(buffer, 'task_dashboard_summary.xlsx')
}
