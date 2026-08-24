import { useCallback, useEffect, useState, useRef } from 'react'
import { Bot, RefreshCw } from 'lucide-react'
import { Card } from '../ui/Card'
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
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-50 text-accent-600">
          <Bot size={18} />
        </div>
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-ink-600">
            {generating || !insight ? 'กำลังประมวลผลสรุปภาพรวมทีม...' : insight.summary}
          </p>
          {insight && !generating && (
            <>
              <p className="text-sm leading-relaxed text-ink-500">{insight.suggested_action}</p>
              <p className="text-xs italic text-ink-400">{insight.confidence_note}</p>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}