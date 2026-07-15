export type TaskStatus = 'todo' | 'doing' | 'done' | 'blocked'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type WorkloadLevel = 'overload' | 'balanced' | 'underload'

export interface Team {
  id: string
  name: string
  category: string | null
  created_at: string
}

export interface Member {
  id: string
  name: string
  email: string | null
  team_id: string | null
  avatar_url: string | null
  created_at: string
}

export interface Task {
  id: string
  title: string
  team_id: string | null
  owner_id: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  progress: number
  effort_days: number
  created_at: string
  updated_at: string
}

export interface TaskWithRelations extends Task {
  team: Team | null
  owner: Member | null
}

export interface MemberWorkload {
  member: Member
  openTaskCount: number
  totalEffortDays: number
  overdueCount: number
  weightedRemainingEffort: number
  loadScore: number
  level: WorkloadLevel
  reason: string
  suggestedAction: string | null
}

export interface TeamWorkloadSummary {
  team: Team
  avgLoadScore: number
  overloadCount: number
  balancedCount: number
  underloadCount: number
  memberCount: number
}

export interface WeeklyTrendPoint {
  week: string
  closed: number
}

export interface AiSummaryResult {
  summary: string
  generated_at: string
}
