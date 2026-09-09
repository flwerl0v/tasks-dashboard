/**
 * Extracts a human-readable message from a caught value.
 *
 * `err instanceof Error` alone isn't enough here: Supabase surfaces network-level
 * failures (DNS, offline, CORS) as plain `{ message, details, hint, code }` objects
 * rather than `Error` instances, so a naive check falls through to a generic
 * fallback and hides the real reason.
 */
export function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  if (typeof err === 'string' && err.trim()) return err
  return fallback
}

function getErrorCode(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code: unknown }).code
    if (typeof code === 'string') return code
  }
  return undefined
}

/**
 * Like toErrorMessage(), but recognizes the handful of Supabase failure modes worth calling
 * out by name instead of surfacing raw fetch/Postgrest text — most importantly a free-tier
 * project that auto-paused from inactivity, which otherwise just looks like "Failed to fetch".
 */
export function describeSupabaseError(err: unknown, fallback: string): string {
  const message = toErrorMessage(err, '')

  // A browser fetch() that never reached any server (DNS, refused connection, offline, CORS)
  // throws with one of these messages depending on the browser. On a free-tier Supabase
  // project the overwhelmingly common real-world cause is that it auto-paused itself.
  if (/failed to fetch|networkerror|load failed|fetch failed/i.test(message)) {
    return (
      'เชื่อมต่อ Supabase ไม่ได้ (Network Error) — เป็นไปได้ว่าโปรเจกต์ถูกพักการทำงานอัตโนมัติ ' +
      '(แผนฟรีจะ Pause โปรเจกต์หลังไม่มีการใช้งานเกิน ~7 วัน) ลองเข้าไปกด Resume ที่ Supabase Dashboard ' +
      'แล้วลองใหม่อีกครั้ง หรือตรวจสอบการเชื่อมต่ออินเทอร์เน็ต'
    )
  }

  const code = getErrorCode(err)
  if (code === 'PGRST301' || /jwt/i.test(message)) {
    return `API Key ของ Supabase ไม่ถูกต้องหรือหมดอายุ — ตรวจสอบ VITE_SUPABASE_ANON_KEY ในไฟล์ .env (${message})`
  }
  if (code === '42501' || /row-level security|permission denied/i.test(message)) {
    return `ไม่มีสิทธิ์เข้าถึงข้อมูลนี้ (Row Level Security) — ตรวจสอบ RLS Policy ของตารางใน Supabase (${message})`
  }

  return toErrorMessage(err, fallback)
}
