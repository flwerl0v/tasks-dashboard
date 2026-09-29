import { useEffect, useRef, useState } from 'react'
import { RefreshCw, ShieldAlert } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { WorkloadBadge } from '../ui/Badge'
import { GeminiIcon } from '../ui/GeminiIcon'
import { generateMemberInsight } from '../../lib/workloadInsight'
import type { AiWorkloadInsight, MemberWorkload, Task } from '../../types'

interface AiInsightModalProps {
  workload: MemberWorkload | null
  tasks: Task[]
  onClose: () => void
}

function InsightField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className="mt-1 text-sm leading-relaxed text-ink-700">{value}</p>
    </div>
  )
}

/** REQ-AI: AI Insight Drawer — per-owner AI explanation on demand, with rule-based fallback shown transparently. */
export function AiInsightModal({ workload, tasks, onClose }: AiInsightModalProps) {
  const [insight, setInsight] = useState<AiWorkloadInsight | null>(null)
  const [loading, setLoading] = useState(false)
  const cache = useRef(new Map<string, AiWorkloadInsight>())

  const load = async (w: MemberWorkload, force = false) => {
    if (!force && cache.current.has(w.member.id)) {
      setInsight(cache.current.get(w.member.id) ?? null)
      return
    }
    setLoading(true)
    const result = await generateMemberInsight(w, tasks)
    cache.current.set(w.member.id, result)
    setInsight(result)
    setLoading(false)
  }

  useEffect(() => {
    if (workload) {
      void load(workload)
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears stale content once the modal has closed
      setInsight(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workload?.member.id])

  return (
    <Modal
      open={workload !== null}
      onClose={onClose}
      title={workload ? `AI Insight — ${workload.member.name}` : 'AI Insight'}
      description="สัญญาณช่วย Manager ตรวจสอบภาระงาน ไม่ใช่การชี้ขาดผลงาน"
      icon={insight?.source === 'fallback' ? ShieldAlert : GeminiIcon}
      iconClassName={
        insight?.source === 'fallback' ? 'bg-warning-50 text-warning-600 ring-warning-500/40' : 'bg-white ring-primary-500/30'
      }
      footer={
        workload && (
          <button
            type="button"
            onClick={() => void load(workload, true)}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            ขอสรุปใหม่
          </button>
        )
      }
    >
      {workload && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <WorkloadBadge level={workload.level} />
            <span className="text-xs text-ink-400">
              Load Score {workload.loadScore}% · งานคงเหลือ {workload.openTaskCount} · เกินกำหนด {workload.overdueCount}
            </span>
          </div>

          <div
            className={`rounded-xl border bg-gradient-to-br p-4 sm:p-5 ${
              insight?.source === 'fallback'
                ? 'border-warning-500/20 from-warning-50 via-surface to-surface'
                : 'border-accent-600/10 from-accent-50 via-surface to-surface'
            }`}
          >
            {loading || !insight ? (
              <p className="flex items-center gap-2 text-sm text-ink-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-600" />
                กำลังประมวลผล AI Insight...
              </p>
            ) : (
              <div className="space-y-3">
                <InsightField label="สรุป" value={insight.summary} />
                <InsightField label="เหตุผล" value={insight.risk_reason} />
                <InsightField label="คำแนะนำ" value={insight.suggested_action} />
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      insight.source === 'fallback' ? 'bg-warning-100 text-warning-700' : 'bg-primary-100 text-primary-700'
                    }`}
                  >
                    {insight.source === 'fallback' ? <ShieldAlert size={12} /> : <GeminiIcon size={12} />}
                    {insight.source === 'fallback' ? 'Rule-Based' : 'Gemini AI'}
                  </span>
                  <span className="text-xs text-ink-400">{insight.confidence_note}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
