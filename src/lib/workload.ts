import type { Member, MemberWorkload, Task, Team, TeamWorkloadSummary, WeeklyTrendPoint } from '../types'
import { WORKLOAD_CONFIG } from './workloadConfig'

/** Remaining Effort = Effort (days) × (1 - Progress). Zero for done tasks. */
export function remainingEffortDays(task: Task): number {
  if (task.status === 'done') return 0
  return Math.max(0, task.effort_days * (1 - task.progress / 100))
}

/** Weighted Effort = Remaining Effort × Priority Weight — makes higher-priority work count more. */
export function weightedRemainingEffort(task: Task): number {
  return remainingEffortDays(task) * WORKLOAD_CONFIG.priorityWeight[task.priority]
}

/** Due Date Risk — grounded, numeric reason string for one task, or null if it carries no risk. */
export function dueDateRiskReason(task: Task): string | null {
  if (task.status === 'done' || !task.due_date) return null
  const due = new Date(task.due_date)
  const today = new Date(new Date().toDateString())
  const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `"${task.title}" เกินกำหนดแล้ว ${Math.abs(diffDays)} วัน`
  if (diffDays <= WORKLOAD_CONFIG.dueSoonDays && task.progress < WORKLOAD_CONFIG.dueSoonLowProgressBelow) {
    return `"${task.title}" ใกล้ครบกำหนดใน ${diffDays} วัน แต่ความคืบหน้ายังอยู่ที่ ${task.progress}%`
  }
  return null
}

/**
 * Load Score % = SUM(Weighted Remaining Effort) / Weekly Capacity × 100.
 * Classification and explanation are 100% rule-based (no LLM call) — this is the
 * built-in fallback the requirement asks for (REQ-AI-006): there is nothing to
 * fall back FROM, the numbers are always available.
 */
export function computeMemberWorkloads(members: Member[], tasks: Task[]): MemberWorkload[] {
  return members
    .map((member) => {
      const memberTasks = tasks.filter((tsk) => tsk.owner_id === member.id)
      const openTasks = memberTasks.filter((tsk) => tsk.status !== 'done')
      const openTaskCount = openTasks.length
      const totalEffortDays = openTasks.reduce((sum, tsk) => sum + tsk.effort_days, 0)
      const overdueCount = openTasks.filter((tsk) => dueDateRiskReason(tsk)?.includes('เกินกำหนด')).length

      const weightedEffortSum = openTasks.reduce((sum, tsk) => sum + weightedRemainingEffort(tsk), 0)
      const loadScore = Math.round((weightedEffortSum / WORKLOAD_CONFIG.weeklyCapacityDays) * 100)

      let level: MemberWorkload['level'] = 'balanced'
      if (loadScore > WORKLOAD_CONFIG.overloadAbove) level = 'overload'
      else if (loadScore < WORKLOAD_CONFIG.underloadBelow) level = 'underload'

      const riskReasons = openTasks.map(dueDateRiskReason).filter((r): r is string => Boolean(r))
      const highPriorityCount = openTasks.filter((tsk) => tsk.priority === 'high' || tsk.priority === 'critical').length

      // REQ-AI-003: explanation built only from computed numbers — no personal/performance judgement.
      const reasonParts: string[] = [
        `Load Score ${loadScore}% (งานคงเหลือถ่วงน้ำหนัก ${weightedEffortSum.toFixed(1)} วัน จากกำลังรับได้ ${WORKLOAD_CONFIG.weeklyCapacityDays} วัน/สัปดาห์)`,
      ]
      if (level === 'overload') {
        if (highPriorityCount > 0) reasonParts.push(`มีงาน priority สูง/วิกฤต ${highPriorityCount} งาน`)
        if (riskReasons.length > 0) reasonParts.push(`${riskReasons.length} งานใกล้ครบกำหนดหรือเกินกำหนด`)
      }
      const reason = reasonParts.join(' — ')

      // REQ-AI-004: every member gets a suggestion, worded with their own numbers so
      // it doesn't read as identical boilerplate across everyone at the same level.
      let suggestedAction: string
      if (level === 'overload') {
        suggestedAction =
          riskReasons.length > 0
            ? `ควรกระจายงานบางส่วนให้เพื่อนร่วมทีม และติดตามงาน ${riskReasons.length} รายการที่ใกล้/เกินกำหนดก่อนงานอื่น`
            : `มีงานคงเหลือ ${openTaskCount} งาน (Load Score ${loadScore}%) ควรกระจายงานบางส่วนให้เพื่อนร่วมทีม หรือชะลอการมอบหมายงานใหม่ในสัปดาห์นี้`
      } else if (level === 'underload') {
        const remainingCapacityDays = Math.max(0, WORKLOAD_CONFIG.weeklyCapacityDays - weightedEffortSum)
        suggestedAction = `มีภาระงานคงเหลือเพียง ${weightedEffortSum.toFixed(1)} วัน จากกำลังรับได้ ${WORKLOAD_CONFIG.weeklyCapacityDays} วัน/สัปดาห์ (เหลือรับเพิ่มได้อีกราว ${remainingCapacityDays.toFixed(1)} วัน) สามารถรับงานเพิ่มเติมจากเพื่อนร่วมทีมที่มีภาระงานสูงได้`
      } else {
        suggestedAction = `ภาระงานอยู่ในระดับที่เหมาะสมแล้ว (Load Score ${loadScore}%) ไม่จำเป็นต้องปรับเปลี่ยน`
      }

      return {
        member,
        openTaskCount,
        totalEffortDays,
        overdueCount,
        weightedRemainingEffort: weightedEffortSum,
        loadScore,
        level,
        reason,
        suggestedAction,
      }
    })
    .sort((a, b) => b.loadScore - a.loadScore)
}

/** REQ-AI-005: per-team rollup of average Load Score and how many members sit in each bucket. */
export function computeTeamWorkloadSummary(teams: Team[], workloads: MemberWorkload[]): TeamWorkloadSummary[] {
  return teams.map((team) => {
    const teamWorkloads = workloads.filter((w) => w.member.team_id === team.id)
    const avgLoadScore =
      teamWorkloads.length > 0
        ? Math.round(teamWorkloads.reduce((sum, w) => sum + w.loadScore, 0) / teamWorkloads.length)
        : 0

    return {
      team,
      avgLoadScore,
      overloadCount: teamWorkloads.filter((w) => w.level === 'overload').length,
      balancedCount: teamWorkloads.filter((w) => w.level === 'balanced').length,
      underloadCount: teamWorkloads.filter((w) => w.level === 'underload').length,
      memberCount: teamWorkloads.length,
    }
  })
}

/** Buckets closed tasks into ISO week-of-year labels for the closure trend chart. */
export function computeWeeklyClosedTrend(tasks: Task[], weeks = 6): WeeklyTrendPoint[] {
  const closed = tasks.filter((tsk) => tsk.status === 'done')
  const buckets = new Map<string, number>()

  for (const tsk of closed) {
    const d = new Date(tsk.updated_at)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toISOString().slice(0, 10)
    buckets.set(key, (buckets.get(key) ?? 0) + 1)
  }

  const today = new Date()
  const currentWeekStart = new Date(today)
  currentWeekStart.setDate(today.getDate() - today.getDay())

  let running = 0
  const points: WeeklyTrendPoint[] = []
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(currentWeekStart)
    weekStart.setDate(currentWeekStart.getDate() - i * 7)
    const key = weekStart.toISOString().slice(0, 10)
    running += buckets.get(key) ?? 0
    points.push({ week: `W${weeks - i}`, closed: running })
  }
  return points
}
