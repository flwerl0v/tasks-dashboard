import { useCallback, useEffect, useState, useRef } from 'react'
import { RefreshCw, ShieldAlert } from 'lucide-react'
import { Card } from '../ui/Card'
import { GeminiIcon } from '../ui/GeminiIcon'
import { generateTeamWorkloadInsight } from '../../lib/workloadInsight'
import type { AiWorkloadInsight, MemberWorkload, TeamWorkloadSummary } from '../../types'

interface TeamWorkloadInsightCardProps {
  teamSummary: TeamWorkloadSummary[]
  workloads: MemberWorkload[]
}

/** REQ-AI Team Workload Summary — cross-team AI narrative, rule-based fallback if AI is unavailable. */
export function TeamWorkloadInsightCard({ teamSummary, workloads }: TeamWorkloadInsightCardProps) {
  const [insight, setInsight] = useState<AiWorkloadInsight | null>(null)
  const [generating, setGenerating] = useState(false)
  const hasFetchedRef = useRef(false) // ป้องกันการสั่งยิงซ้ำใน StrictMode

  const runInsight = useCallback(async () => {
    if (!teamSummary.length) return
    setGenerating(true)
    try {
      const result = await generateTeamWorkloadInsight(teamSummary, workloads)
      setInsight(result)
    } catch (err) {
      console.error('[TeamWorkloadInsightCard] Error:', err)
    } finally {
      setGenerating(false)
    }
  }, [teamSummary, workloads])

  useEffect(() => {
    // ยิงแค่นัดแรกเมื่อมีข้อมูล และไม่เคยยิงมาก่อน
    if (teamSummary.length > 0 && !hasFetchedRef.current) {
      hasFetchedRef.current = true
      void runInsight()
    }
  }, [teamSummary.length, runInsight])

  const handleManualRefresh = () => {
    hasFetchedRef.current = false // ปลดล็อกให้กด Refresh เองได้
    void runInsight()
  }

  return (
    <Card
      title="AI สรุปภาพรวมภาระงานทีม"
      action={
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={generating}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 disabled:opacity-50"
        >
          <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
    >
      <div className="flex gap-4 rounded-xl border border-accent-600/10 bg-gradient-to-br from-accent-50 via-surface to-surface p-4 sm:p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-border">
          <GeminiIcon size={22} />
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          {generating || !insight ? (
            <p className="flex items-center gap-2 text-sm text-ink-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-600" />
              กำลังประมวลผลสรุปภาพรวมทีม...
            </p>
          ) : (
            <>
              <p className="text-sm font-medium leading-relaxed text-ink-800">{insight.summary}</p>
              <p className="text-sm leading-relaxed text-ink-500">{insight.suggested_action}</p>
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
            </>
          )}
        </div>
      </div>
    </Card>
  )
}