import { useCallback, useEffect, useState } from 'react'
import { Bot, RefreshCw } from 'lucide-react'
import { Card } from '../ui/Card'
import { generateAiSummary } from '../../lib/aiSummary'
import { countByStatus, isOverdue } from '../../lib/stats'
import type { MemberWorkload, Task } from '../../types'

interface AiSummaryCardProps {
  tasks: Task[]
  workloads: MemberWorkload[]
}

export function AiSummaryCard({ tasks, workloads }: AiSummaryCardProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  const runSummary = useCallback(async () => {
    setGenerating(true)
    const byStatus = countByStatus(tasks)
    const result = await generateAiSummary({
      totalTasks: tasks.length,
      doneTasks: byStatus.done,
      doingTasks: byStatus.doing,
      todoTasks: byStatus.todo,
      blockedTasks: byStatus.blocked,
      overdueTasks: tasks.filter(isOverdue).length,
      overloadedMembers: workloads.filter((w) => w.level === 'overload').map((w) => w.member.name),
    })
    setSummary(result.summary)
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
      action={
        <button
          type="button"
          onClick={() => void runSummary()}
          disabled={generating}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-50"
        >
          <RefreshCw size={13} className={generating ? 'animate-spin' : ''} />
          Refresh
        </button>
      }
    >
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <Bot size={18} />
        </div>
        <p className="text-sm leading-relaxed text-slate-600">
          {generating ? 'กำลังประมวลผลสรุปภาพรวม...' : (summary ?? 'ยังไม่มีข้อมูลงานสำหรับสรุป')}
        </p>
      </div>
    </Card>
  )
}
