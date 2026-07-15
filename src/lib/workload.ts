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
function dueDateRiskReason(task: Task): string | null {
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

      // REQ-AI-004: at least one suggestion for overload/underload; none needed when balanced.
      let suggestedAction: string | null = null
      if (level === 'overload') {
        suggestedAction =
          riskReasons.length > 0
            ? 'ควรกระจายงานบางส่วนให้เพื่อนร่วมทีม และติดตามงานที่ใกล้/เกินกำหนดก่อนงานอื่น'
            : 'ควรกระจายงานบางส่วนให้เพื่อนร่วมทีม หรือชะลอการมอบหมายงานใหม่ในสัปดาห์นี้'
      } else if (level === 'underload') {
        suggestedAction = 'สามารถรับงานเพิ่มเติมจากเพื่อนร่วมทีมที่มีภาระงานสูงได้'
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

  const sortedKeys = [...buckets.keys()].sort()
  const lastKeys = sortedKeys.slice(-weeks)
  let running = 0
  return lastKeys.map((key, i) => {
    running += buckets.get(key) ?? 0
    return { week: `W${i + 1}`, closed: running }
  })
}
