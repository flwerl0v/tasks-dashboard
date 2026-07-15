import type { TaskPriority } from '../types'

/**
 * Central config for the workload/Load Score engine (REQ-AI-002: "ใช้ threshold ที่กำหนดใน Config").
 * Every number here is the single source of truth for the formulas in workload.ts —
 * change values here, not inline, so the whole app stays consistent.
 */
export const WORKLOAD_CONFIG = {
  /** Priority Weight — REQ table: Low=0.75, Medium=1.00, High=1.25, Critical=1.50 */
  priorityWeight: {
    low: 0.75,
    medium: 1.0,
    high: 1.25,
    critical: 1.5,
  } as Record<TaskPriority, number>,

  /** Weekly Capacity — default working days a person can absorb per week */
  weeklyCapacityDays: 5,

  /** Status Threshold — Load Score % boundaries */
  underloadBelow: 60,
  overloadAbove: 110,

  /** Due Date Risk — a task counts as "ใกล้ครบกำหนด" within this many days if progress is still low */
  dueSoonDays: 3,
  dueSoonLowProgressBelow: 50,
}
