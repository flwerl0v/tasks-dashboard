import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, ShieldAlert } from 'lucide-react'
import { Card } from '../ui/Card'
import { GeminiIcon } from '../ui/GeminiIcon'
import { generateAiSummary } from '../../lib/aiSummary'
import { countByStatus, isDueSoon, isOverdue } from '../../lib/stats'
import type { AiSummaryResult, MemberWorkload, Task } from '../../types'

interface AiSummaryCardProps {
  tasks: Task[]
  workloads: MemberWorkload[]
  className?: string
}

export function AiSummaryCard({ tasks, workloads, className = '' }: AiSummaryCardProps) {
  const [result, setResult] = useState<AiSummaryResult | null>(null)
  const [generating, setGenerating] = useState(false)

  const runSummary = useCallback(async () => {
    setGenerating(true)
    const byStatus = countByStatus(tasks)
    const nextResult = await generateAiSummary({
      totalTasks: tasks.length,
      doneTasks: byStatus.done,
      doingTasks: byStatus.doing,
      todoTasks: byStatus.todo,
      blockedTasks: byStatus.blocked,
      overdueTasks: tasks.filter(isOverdue).length,
      dueSoonTasks: tasks.filter((t) => isDueSoon(t)).length,
      overloadedMembers: workloads.filter((w) => w.level === 'overload').map((w) => w.member.name),
    })
    setResult(nextResult)
    setGenerating(false)
  }, [tasks, workloads])

  useEffect(() => {
    // Regenerate whenever the task set changes — the one intended use of setState-in-effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (tasks.length > 0) void runSummary()
  }, [runSummary, tasks.length])

  return (
    <Card
      title="AI Summary"
      className={className}
      action={
        <button
          type="button"
          onClick={() => void runSummary()}
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
          {generating || !result ? (
            <p className="flex items-center gap-2 text-sm text-ink-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-600" />
              กำลังประมวลผลสรุปภาพรวม...
            </p>
          ) : (
            <>
              <p className="text-sm font-medium leading-relaxed text-ink-800">{result.summary}</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                    result.source === 'fallback' ? 'bg-warning-100 text-warning-700' : 'bg-primary-100 text-primary-700'
                  }`}
                >
                  {result.source === 'fallback' ? <ShieldAlert size={12} /> : <GeminiIcon size={12} />}
                  {result.source === 'fallback' ? 'Rule-Based' : 'Gemini AI'}
                </span>
                <span className="text-xs text-ink-400">{result.confidence_note}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </Card>
  )
}
