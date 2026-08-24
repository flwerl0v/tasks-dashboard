import { useEffect, useRef, useState } from 'react'
import { Bot, RefreshCw, ShieldAlert } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { WorkloadBadge } from '../ui/Badge'
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
      icon={Bot}
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

          {loading || !insight ? (
            <p className="text-sm text-ink-400">กำลังประมวลผล AI Insight...</p>
          ) : (
            <>
              <InsightField label="สรุป" value={insight.summary} />
              <InsightField label="เหตุผล" value={insight.risk_reason} />
              <InsightField label="คำแนะนำ" value={insight.suggested_action} />
              <div className="flex items-start gap-2 rounded-lg bg-surface-50 p-3 text-xs text-ink-500">
                <ShieldAlert size={14} className="mt-0.5 shrink-0 text-warning-500" />
                <span>
                  {insight.confidence_note}
                  {insight.source === 'fallback' && ' (ยังไม่ได้เชื่อมต่อ AI — แสดงผลจากกฎการคำนวณ)'}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </Modal>
  )
}
