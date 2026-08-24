import type { AiSummaryResult } from '../types'

export interface SummaryStats {
  totalTasks: number
  doneTasks: number
  doingTasks: number
  todoTasks: number
  blockedTasks: number
  overdueTasks: number
  dueSoonTasks: number
  overloadedMembers: string[]
}

// --- [CACHE & DEDUPLICATION LOGIC] ---
const summaryCache = new Map<string, { promise: Promise<AiSummaryResult>; timestamp: number }>()
const CACHE_TTL_MS = 15000 // 15 วินาที ดักไม่ให้ยิง API ซ้ำติดๆ กัน

/**
 * Calls the AI Summary endpoint (a Supabase Edge Function, see supabase/functions/ai-summary)
 * so the API key stays server-side. Falls back to a local heuristic summary when the
 * endpoint isn't configured or hits an error.
 */
export async function generateAiSummary(stats: SummaryStats): Promise<AiSummaryResult> {
  const endpoint = import.meta.env.VITE_AI_SUMMARY_ENDPOINT

  if (!endpoint) {
    return { summary: buildFallbackSummary(stats), generated_at: new Date().toISOString() }
  }

  // สร้าง Cache Key จาก Stats Payload
  const cacheKey = JSON.stringify(stats)
  const now = Date.now()
  const cached = summaryCache.get(cacheKey)

  // ถ้ายิงซ้ำภายใน 15 วินาที ให้คืนค่า Promise เดิมทันที (ไม่ยิง HTTP Request ซ้ำ)
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.promise
  }

  // สร้าง Fetch Request จริง
  const fetchPromise = (async (): Promise<AiSummaryResult> => {
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
      // หากเกิดข้อผิดพลาด ให้ลบ Cache เพื่อเปิดโอกาสให้ยิงใหม่
      summaryCache.delete(cacheKey)
      return { summary: buildFallbackSummary(stats), generated_at: new Date().toISOString() }
    }
  })()

  // บันทึกลง Cache
  summaryCache.set(cacheKey, { promise: fetchPromise, timestamp: now })

  return fetchPromise
}

function buildFallbackSummary(stats: SummaryStats): string {
  const donePercent = stats.totalTasks > 0 ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0
  const parts = [
    `ภาพรวมสัปดาห์นี้มีงานทั้งหมด ${stats.totalTasks} งาน เสร็จแล้ว ${stats.doneTasks} งาน (${donePercent}%) กำลังทำ ${stats.doingTasks} งาน และยังไม่เริ่ม ${stats.todoTasks} งาน`,
    stats.blockedTasks > 0 ? `มีงานติดปัญหา ${stats.blockedTasks} งานที่ควรเข้าไปช่วยปลดล็อก` : null,
    stats.dueSoonTasks > 0 ? `มีงานใกล้ครบกำหนด ${stats.dueSoonTasks} งานภายใน 3 วันข้างหน้า` : null,
    stats.overdueTasks > 0
      ? `พบงานเกินกำหนด ${stats.overdueTasks} งาน ควรติดตามอย่างใกล้ชิด`
      : 'ไม่มีงานเกินกำหนดในขณะนี้',
    stats.overloadedMembers.length > 0
      ? `ควรติดตามภาระงานของ ${stats.overloadedMembers.join(', ')} ที่มีภาระงานสูงกว่าระดับปกติ และงานที่ใกล้ครบกำหนดอย่างใกล้ชิด`
      : 'ภาระงานของทีมโดยรวมอยู่ในระดับสมดุล',
  ]
  return parts.filter(Boolean).join(' ')
}