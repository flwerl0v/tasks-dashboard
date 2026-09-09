/**
 * Shared, user-facing reasons for why an AI call fell back to a rule-based result.
 * Used by every "AI card" (workload insight, team workload summary, dashboard AI summary)
 * so a fallback always tells the user *why*, not just *that* it happened.
 */

/** Turns an HTTP failure status into a specific, user-facing reason instead of a bare status code. */
export function describeHttpFailure(status: number): string {
  if (status === 401 || status === 403) return `Edge Function ปฏิเสธการเข้าถึง (HTTP ${status}) — ตรวจสอบ API key/สิทธิ์`
  if (status === 404) return 'ไม่พบ Edge Function ที่ระบุ (HTTP 404) — ตรวจสอบ URL endpoint'
  if (status === 429) return 'โควตา/Token การใช้งาน AI เต็มในขณะนี้ (HTTP 429 — Rate Limit)'
  if (status >= 500) return `Edge Function มีปัญหาฝั่งเซิร์ฟเวอร์ (HTTP ${status})`
  return `Edge Function ตอบกลับผิดปกติ (HTTP ${status})`
}

/**
 * Turns an upstream Gemini API status/detail (forwarded inside an edge function's own 200
 * response, e.g. ai-summary) into a specific, user-facing reason — same idea as
 * describeHttpFailure, but for the AI provider's status rather than our own edge function's.
 */
export function describeGeminiFailure(status?: number, detail?: string): string {
  if (status === 429) return 'โควตา/Token การใช้งาน Gemini API เต็มในขณะนี้ (HTTP 429 — Rate Limit / Quota Exceeded)'
  if (status === 400 || status === 401 || status === 403) return `Gemini API key ไม่ถูกต้องหรือไม่มีสิทธิ์ใช้งาน (HTTP ${status})`
  if (status !== undefined && status >= 500) return `Gemini API มีปัญหาฝั่งเซิร์ฟเวอร์ชั่วคราว (HTTP ${status})`
  if (detail) return detail
  if (status !== undefined) return `Gemini API ตอบกลับผิดปกติ (HTTP ${status})`
  return 'Gemini API ไม่ตอบสนองหรือถูกตัดข้อความกลางคัน'
}

/** Turns a thrown fetch()/parsing error into a specific, user-facing reason. */
export function describeFetchFailure(err: unknown): string {
  if (err instanceof DOMException && err.name === 'AbortError') return 'หมดเวลาเชื่อมต่อ (Timeout)'
  if (err instanceof TypeError) return 'เชื่อมต่อเครือข่ายไม่ได้ (ตรวจสอบอินเทอร์เน็ตหรือการตั้งค่า CORS)'
  if (err instanceof SyntaxError) return 'Edge Function ส่งข้อมูลกลับมาในรูปแบบที่อ่านไม่ได้ (แปลง JSON ไม่สำเร็จ)'
  if (err instanceof Error) return err.message
  return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
}
