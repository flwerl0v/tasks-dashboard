import type {
  AiWorkloadInsight,
  MemberWorkload,
  OwnerWorkloadSummaryInput,
  Task,
  TeamWorkloadSummary,
  TeamWorkloadSummaryInput,
} from '../types'
import { dueDateRiskReason } from './workload'

const LEVEL_LABELS = { overload: 'เยอะเกิน', balanced: 'พอดี', underload: 'น้อยเกิน' } as const

// --- [CACHE & DEDUPLICATION LOGIC] ---
const requestCache = new Map<string, { promise: Promise<AiWorkloadInsight>; timestamp: number }>()
const CACHE_TTL_MS = 15000 // 15 วินาที ดักไม่ให้ยิง API ซ้ำติดๆ กัน

function buildOwnerSummaryInput(workload: MemberWorkload, tasks: Task[]): OwnerWorkloadSummaryInput {
  const openTasks = tasks.filter((t) => t.owner_id === workload.member.id && t.status !== 'done')
  const topRiskTasks = openTasks
    .map(dueDateRiskReason)
    .filter((r): r is string => Boolean(r))
    .slice(0, 3)

  return {
    owner: workload.member.name,
    openTaskCount: workload.openTaskCount,
    loadScore: workload.loadScore,
    status: workload.level,
    overdueCount: workload.overdueCount,
    topRiskTasks,
  }
}

function buildTeamSummaryInput(teamSummary: TeamWorkloadSummary[], workloads: MemberWorkload[]): TeamWorkloadSummaryInput {
  return {
    teams: teamSummary.map((s) => ({
      team: s.team.name,
      memberCount: s.memberCount,
      avgLoadScore: s.avgLoadScore,
      overloadCount: s.overloadCount,
      balancedCount: s.balancedCount,
      underloadCount: s.underloadCount,
    })),
    topOverloadedMembers: workloads
      .filter((w) => w.level === 'overload')
      .slice(0, 5)
      .map((w) => w.member.name),
  }
}

/** Fallback Rule-Based (Always Available) */
function fallbackMemberInsight(workload: MemberWorkload): AiWorkloadInsight {
  return {
    summary: `Load Score ${workload.loadScore}% จัดเป็น "${LEVEL_LABELS[workload.level]}" จากงานคงเหลือ ${workload.openTaskCount} งาน`,
    risk_reason: workload.reason,
    suggested_action: workload.suggestedAction,
    confidence_note: 'คำแนะนำนี้คำนวณจากตัวเลขงานคงเหลือและกำหนดส่งโดยตรง ไม่ได้ผ่านการวิเคราะห์ของ AI',
    source: 'fallback',
    generated_at: new Date().toISOString(),
  }
}

function fallbackTeamInsight(teamSummary: TeamWorkloadSummary[]): AiWorkloadInsight {
  const overloaded = teamSummary.filter((s) => s.overloadCount > 0)
  return {
    summary:
      overloaded.length > 0
        ? `พบทีมที่มีสมาชิกภาระงานเยอะเกินอย่างน้อย 1 คนใน ${overloaded.length} ทีม จากทั้งหมด ${teamSummary.length} ทีม`
        : `ทุกทีม (${teamSummary.length} ทีม) มีภาระงานอยู่ในเกณฑ์ที่กำหนด`,
    risk_reason: overloaded.map((s) => `${s.team.name}: เยอะเกิน ${s.overloadCount}/${s.memberCount} คน`).join(' · ') || 'ไม่พบทีมที่มีความเสี่ยงด้าน workload',
    suggested_action:
      overloaded.length > 0
        ? 'ควรตรวจสอบการกระจายงานในทีมที่มีสัดส่วนภาระงานเยอะเกินสูง และพิจารณาโยกงานข้ามทีมหากจำเป็น'
        : 'ยังไม่จำเป็นต้องปรับการกระจายงานในขณะนี้',
    confidence_note: 'คำแนะนำนี้คำนวณจากตัวเลขงานคงเหลือและกำหนดส่งโดยตรง ไม่ได้ผ่านการวิเคราะห์ของ AI',
    source: 'fallback',
    generated_at: new Date().toISOString(),
  }
}

/** Turns an HTTP failure status into a specific, user-facing reason instead of a bare status code. */
function describeHttpFailure(status: number): string {
  if (status === 401 || status === 403) return `Edge Function ปฏิเสธการเข้าถึง (HTTP ${status}) — ตรวจสอบ API key/สิทธิ์`
  if (status === 404) return 'ไม่พบ Edge Function ที่ระบุ (HTTP 404) — ตรวจสอบ URL endpoint'
  if (status === 429) return 'เรียกใช้ AI เกิน quota ในขณะนี้ (HTTP 429 — Rate Limit)'
  if (status >= 500) return `Edge Function มีปัญหาฝั่งเซิร์ฟเวอร์ (HTTP ${status})`
  return `Edge Function ตอบกลับผิดปกติ (HTTP ${status})`
}

/** Turns a thrown fetch()/parsing error into a specific, user-facing reason. */
function describeFetchFailure(err: unknown): string {
  if (err instanceof DOMException && err.name === 'AbortError') return 'หมดเวลาเชื่อมต่อ (Timeout)'
  if (err instanceof TypeError) return 'เชื่อมต่อเครือข่ายไม่ได้ (ตรวจสอบอินเทอร์เน็ตหรือการตั้งค่า CORS)'
  if (err instanceof SyntaxError) return 'Edge Function ส่งข้อมูลกลับมาในรูปแบบที่อ่านไม่ได้ (แปลง JSON ไม่สำเร็จ)'
  if (err instanceof Error) return err.message
  return 'เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ'
}

function withFailureReason(fallback: AiWorkloadInsight, reason: string): AiWorkloadInsight {
  return { ...fallback, confidence_note: `${fallback.confidence_note} (สาเหตุ: ${reason})` }
}

async function callInsightEndpoint(bodyPayload: Record<string, unknown>, fallback: AiWorkloadInsight): Promise<AiWorkloadInsight> {
  // ดึงค่าจาก .env ถ้าไม่มี ให้ใช้ URL ตรงของ Supabase Edge Function ทันที
  const endpoint = 
    import.meta.env.VITE_WORKLOAD_INSIGHT_ENDPOINT || 
    'https://xceumzdaupwfytfacgsk.supabase.co/functions/v1/workload-insight'

  // ห่อ Request Body ให้ตรงตามที่ Edge Function คาดหวัง
  const requestBody = {
    level: bodyPayload.level,
    payload: bodyPayload,
  }
  

  const cacheKey = JSON.stringify(requestBody)
  const now = Date.now()
  const cached = requestCache.get(cacheKey)

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.promise
  }

  const fetchPromise = (async (): Promise<AiWorkloadInsight> => {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!res.ok) {
        const reason = describeHttpFailure(res.status)
        console.error(`[workload-insight] ${reason}`)
        requestCache.delete(cacheKey)
        return withFailureReason(fallback, reason)
      }

      const data = await res.json()

      // อ่านค่าจาก Response แบบยืดหยุ่น (เผื่อ Edge Function ส่งกลับมาหลายคีย์)
      return {
        summary: data.summary || data.insight || fallback.summary,
        risk_reason: data.risk_reason || data.reason || fallback.risk_reason,
        suggested_action: data.suggested_action || data.recommendation || (Array.isArray(data.recommendations) ? data.recommendations[0] : fallback.suggested_action),
        confidence_note: data.confidence_note || 'เป็นสัญญาณช่วยตรวจสอบ ไม่ใช่การชี้ขาด โปรดตรวจสอบก่อนตัดสินใจ',
        source: 'ai',
        generated_at: new Date().toISOString(),
      }
    } catch (err) {
      const reason = describeFetchFailure(err)
      console.error(`[workload-insight] Request failed, falling back to Rule-Based: ${reason}`, err)
      requestCache.delete(cacheKey)
      return withFailureReason(fallback, reason)
    }
  })()

  requestCache.set(cacheKey, { promise: fetchPromise, timestamp: now })
  return fetchPromise
}

export async function generateMemberInsight(workload: MemberWorkload, tasks: Task[]): Promise<AiWorkloadInsight> {
  const fallback = fallbackMemberInsight(workload)
  const input = buildOwnerSummaryInput(workload, tasks)
  return callInsightEndpoint({ level: 'member', ...input }, fallback)
}

export async function generateTeamWorkloadInsight(
  teamSummary: TeamWorkloadSummary[],
  workloads: MemberWorkload[],
): Promise<AiWorkloadInsight> {
  const fallback = fallbackTeamInsight(teamSummary)
  const input = buildTeamSummaryInput(teamSummary, workloads)
  return callInsightEndpoint({ level: 'team', ...input }, fallback)
}