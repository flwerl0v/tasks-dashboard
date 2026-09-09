import type { AiSummaryResult } from '../types'
import { describeFetchFailure, describeGeminiFailure, describeHttpFailure } from './aiFailureReason'

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

const FALLBACK_NOTE = 'คำแนะนำนี้คำนวณจากตัวเลขงานคงเหลือและกำหนดส่งโดยตรง ไม่ได้ผ่านการวิเคราะห์ของ AI'

// --- [CACHE & DEDUPLICATION LOGIC] ---
const summaryCache = new Map<string, { promise: Promise<AiSummaryResult>; timestamp: number }>()
const CACHE_TTL_MS = 15000 // 15 วินาที ดักไม่ให้ยิง API ซ้ำติดๆ กัน

/**
 * Calls the AI Summary endpoint (a Supabase Edge Function, see supabase/functions/ai-summary)
 * so the API key stays server-side. Falls back to a local heuristic summary — always with a
 * specific, user-facing reason attached — when the endpoint isn't configured or hits an error.
 */
export async function generateAiSummary(stats: SummaryStats): Promise<AiSummaryResult> {
  const endpoint = import.meta.env.VITE_AI_SUMMARY_ENDPOINT

  const fallbackWithReason = (reason: string): AiSummaryResult => ({
    summary: buildFallbackSummary(stats),
    generated_at: new Date().toISOString(),
    source: 'fallback',
    confidence_note: `${FALLBACK_NOTE} (สาเหตุ: ${reason})`,
  })

  if (!endpoint) {
    return fallbackWithReason('ยังไม่ได้ตั้งค่า AI Summary Endpoint')
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

      if (!res.ok) {
        const reason = describeHttpFailure(res.status)
        console.error(`[ai-summary] ${reason}`)
        summaryCache.delete(cacheKey)
        return fallbackWithReason(reason)
      }

      const data: { summary: string; is_fallback?: boolean; status?: number; detail?: string; error?: string } =
        await res.json()

      // The edge function itself falls back to a rule-based summary when Gemini errors, is
      // rate-limited, or truncates — it still returns 200, so check its own flag, not just res.ok.
      // It also forwards Gemini's real status/detail (or its own error message), so the reason
      // shown to the user is specific ("โควตา/Token เต็ม", "API key ผิด", ...) not just "ใช้งานไม่ได้".
      if (data.is_fallback || data.error) {
        const reason = data.error ?? describeGeminiFailure(data.status, data.detail)
        return {
          summary: data.summary,
          generated_at: new Date().toISOString(),
          source: 'fallback',
          confidence_note: `${FALLBACK_NOTE} (สาเหตุ: ${reason})`,
        }
      }

      return {
        summary: data.summary,
        generated_at: new Date().toISOString(),
        source: 'ai',
        confidence_note: 'สรุปนี้เป็นสัญญาณช่วยตรวจสอบภาพรวมงาน ไม่ใช่การชี้ขาด โปรดตรวจสอบก่อนตัดสินใจ',
      }
    } catch (err) {
      const reason = describeFetchFailure(err)
      console.error(`[ai-summary] Request failed, falling back to Rule-Based: ${reason}`, err)
      // หากเกิดข้อผิดพลาด ให้ลบ Cache เพื่อเปิดโอกาสให้ยิงใหม่
      summaryCache.delete(cacheKey)
      return fallbackWithReason(reason)
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
