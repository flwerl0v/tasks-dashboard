import type { AiSummaryResult } from '../types'

export interface SummaryStats {
  totalTasks: number
  doneTasks: number
  doingTasks: number
  todoTasks: number
  blockedTasks: number
  overdueTasks: number
  overloadedMembers: string[]
}

/**
 * Calls the AI Summary endpoint (a Supabase Edge Function, see supabase/functions/ai-summary)
 * so the OpenAI API key stays server-side. Falls back to a local heuristic summary when the
 * endpoint isn't configured yet (e.g. during local development).
 */
export async function generateAiSummary(stats: SummaryStats): Promise<AiSummaryResult> {
  const endpoint = import.meta.env.VITE_AI_SUMMARY_ENDPOINT

  if (endpoint) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stats),
      })
      if (!res.ok) throw new Error(`AI summary endpoint returned ${res.status}`)
      const data: { summary: string } = await res.json()
      return { summary: data.summary, generated_at: new Date().toISOString() }
    } catch (err) {
      console.error('[ai-summary] endpoint call failed, using local fallback summary:', err)
    }
  }

  return { summary: buildFallbackSummary(stats), generated_at: new Date().toISOString() }
}

function buildFallbackSummary(stats: SummaryStats): string {
  const donePercent = stats.totalTasks > 0 ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0
  const parts = [
    `ภาพรวมสัปดาห์นี้มีงานทั้งหมด ${stats.totalTasks} งาน เสร็จแล้ว ${stats.doneTasks} งาน (${donePercent}%) กำลังทำ ${stats.doingTasks} งาน และยังไม่เริ่ม ${stats.todoTasks} งาน`,
    stats.blockedTasks > 0 ? `มีงานติดปัญหา ${stats.blockedTasks} งานที่ควรเข้าไปช่วยปลดล็อก` : null,
    stats.overdueTasks > 0
      ? `พบงานเกินกำหนด ${stats.overdueTasks} งาน ควรติดตามอย่างใกล้ชิด`
      : 'ไม่มีงานเกินกำหนดในขณะนี้',
    stats.overloadedMembers.length > 0
      ? `ควรติดตามภาระงานของ ${stats.overloadedMembers.join(', ')} ที่มีภาระงานสูงกว่าระดับปกติ`
      : 'ภาระงานของทีมโดยรวมอยู่ในระดับสมดุล',
  ]
  return parts.filter(Boolean).join(' ')
}
