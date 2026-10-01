import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computeMemberWorkloads,
  computeTeamWorkloadSummary,
  dueDateRiskReason,
  remainingEffortDays,
  weightedRemainingEffort,
  workloadLevelForScore,
} from './workload'
import type { Member, Task, Team } from '../types'

// Small builders so each test only spells out the fields it cares about.
const task = (overrides: Partial<Task> = {}): Task => ({
  id: 't1',
  title: 'งานทดสอบ',
  team_id: null,
  owner_id: 'm1',
  status: 'doing',
  priority: 'medium',
  due_date: null,
  progress: 0,
  effort_days: 1,
  created_at: '2026-09-01T00:00:00Z',
  updated_at: '2026-09-01T00:00:00Z',
  ...overrides,
})

const member = (id: string, teamId: string | null = null): Member => ({
  id,
  name: `สมาชิก ${id}`,
  email: null,
  team_id: teamId,
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
})

describe('workloadLevelForScore', () => {
  it('uses the thresholds in the config (under 60, over 110)', () => {
    expect(workloadLevelForScore(0)).toBe('underload')
    expect(workloadLevelForScore(59)).toBe('underload')
    expect(workloadLevelForScore(60)).toBe('balanced')
    expect(workloadLevelForScore(110)).toBe('balanced')
    expect(workloadLevelForScore(111)).toBe('overload')
  })
})

describe('remainingEffortDays / weightedRemainingEffort', () => {
  it('scales effort by how much is still unfinished', () => {
    expect(remainingEffortDays(task({ effort_days: 4, progress: 25 }))).toBe(3)
  })

  it('is zero for done tasks, even if progress was never set to 100', () => {
    expect(remainingEffortDays(task({ status: 'done', effort_days: 5, progress: 0 }))).toBe(0)
  })

  it('never goes negative', () => {
    expect(remainingEffortDays(task({ effort_days: 2, progress: 120 }))).toBe(0)
  })

  it('weights by priority (low 0.75, medium 1, high 1.25, critical 1.5)', () => {
    expect(weightedRemainingEffort(task({ priority: 'low', effort_days: 2 }))).toBeCloseTo(1.5)
    expect(weightedRemainingEffort(task({ priority: 'medium', effort_days: 2 }))).toBeCloseTo(2)
    expect(weightedRemainingEffort(task({ priority: 'high', effort_days: 2 }))).toBeCloseTo(2.5)
    expect(weightedRemainingEffort(task({ priority: 'critical', effort_days: 2 }))).toBeCloseTo(3)
  })
})

describe('dueDateRiskReason', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-01T12:00:00'))
  })
  afterEach(() => vi.useRealTimers())

  it('flags a task that is past its due date, with the number of days', () => {
    expect(dueDateRiskReason(task({ due_date: '2026-09-26' }))).toContain('เกินกำหนดแล้ว 5 วัน')
  })

  it('flags a task due within 3 days when progress is still under 50%', () => {
    expect(dueDateRiskReason(task({ due_date: '2026-10-03', progress: 20 }))).toContain('ใกล้ครบกำหนด')
  })

  it('does not flag a task due soon if it is mostly done', () => {
    expect(dueDateRiskReason(task({ due_date: '2026-10-03', progress: 80 }))).toBeNull()
  })

  it('does not flag a task that is due far in the future', () => {
    expect(dueDateRiskReason(task({ due_date: '2026-12-01', progress: 0 }))).toBeNull()
  })

  it('never flags done tasks or tasks without a due date', () => {
    expect(dueDateRiskReason(task({ status: 'done', due_date: '2026-09-01' }))).toBeNull()
    expect(dueDateRiskReason(task({ due_date: null }))).toBeNull()
  })
})

describe('computeMemberWorkloads', () => {
  it('gives a member with no tasks a score of 0 and "underload"', () => {
    const [result] = computeMemberWorkloads([member('m1')], [])
    expect(result.loadScore).toBe(0)
    expect(result.level).toBe('underload')
    expect(result.openTaskCount).toBe(0)
  })

  it('turns 5 days of medium work into exactly 100% (balanced)', () => {
    const [result] = computeMemberWorkloads([member('m1')], [task({ effort_days: 5 })])
    expect(result.loadScore).toBe(100)
    expect(result.level).toBe('balanced')
  })

  it('classes 6 days of medium work as overload (120%)', () => {
    const [result] = computeMemberWorkloads([member('m1')], [task({ effort_days: 6 })])
    expect(result.loadScore).toBe(120)
    expect(result.level).toBe('overload')
  })

  it('counts priority: the same effort scores higher when it is critical', () => {
    const [medium] = computeMemberWorkloads([member('m1')], [task({ effort_days: 4 })])
    const [critical] = computeMemberWorkloads([member('m1')], [task({ effort_days: 4, priority: 'critical' })])
    expect(critical.loadScore).toBeGreaterThan(medium.loadScore)
    expect(critical.loadScore).toBe(120)
  })

  it('ignores done tasks and tasks owned by someone else', () => {
    const tasks = [
      task({ id: 'a', effort_days: 3 }),
      task({ id: 'b', effort_days: 10, status: 'done' }),
      task({ id: 'c', effort_days: 10, owner_id: 'someone-else' }),
    ]
    const [result] = computeMemberWorkloads([member('m1')], tasks)
    expect(result.openTaskCount).toBe(1)
    expect(result.loadScore).toBe(60)
  })

  it('sorts members from the heaviest load to the lightest', () => {
    const tasks = [task({ id: 'a', owner_id: 'light', effort_days: 1 }), task({ id: 'b', owner_id: 'heavy', effort_days: 6 })]
    const results = computeMemberWorkloads([member('light'), member('heavy')], tasks)
    expect(results.map((r) => r.member.id)).toEqual(['heavy', 'light'])
  })

  it('counts overdue open tasks', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-01T12:00:00'))
    try {
      const tasks = [task({ id: 'a', due_date: '2026-09-20' }), task({ id: 'b', due_date: '2026-12-01' })]
      const [result] = computeMemberWorkloads([member('m1')], tasks)
      expect(result.overdueCount).toBe(1)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('computeTeamWorkloadSummary', () => {
  const team = (id: string): Team => ({ id, name: id, category: null, created_at: '2026-01-01T00:00:00Z' })

  it('averages the load score and counts members per level', () => {
    const members = [member('a', 't1'), member('b', 't1'), member('c', 't2')]
    const tasks = [
      task({ id: '1', owner_id: 'a', effort_days: 6 }), // 120% -> overload
      task({ id: '2', owner_id: 'b', effort_days: 1 }), // 20%  -> underload
    ]
    const summary = computeTeamWorkloadSummary([team('t1'), team('t2')], computeMemberWorkloads(members, tasks))
    const t1 = summary.find((s) => s.team.id === 't1')!
    expect(t1.memberCount).toBe(2)
    expect(t1.avgLoadScore).toBe(70)
    expect(t1.overloadCount).toBe(1)
    expect(t1.underloadCount).toBe(1)
    expect(t1.balancedCount).toBe(0)
  })

  it('reports 0 for a team with no members instead of dividing by zero', () => {
    const [summary] = computeTeamWorkloadSummary([team('empty')], [])
    expect(summary.avgLoadScore).toBe(0)
    expect(summary.memberCount).toBe(0)
  })
})
