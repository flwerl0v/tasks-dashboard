import type { Task } from '../../types'

/**
 * Stacked status bar + legend used by the team card and the team detail page.
 * Same status hues as the charts, except To Do is grey (not blue) so the bar stays calm.
 */
export function StatusStack({ tasks, colorLabels = false }: { tasks: Task[]; colorLabels?: boolean }) {
  const total = tasks.length
  if (total === 0) return <p className="text-xs text-ink-400">ยังไม่มีงานในทีมนี้</p>

  const count = (status: Task['status']) => tasks.filter((t) => t.status === status).length
  const segments = [
    { key: 'done', label: 'สำเร็จ', value: count('done'), bar: 'bg-success-500', text: 'text-success-700' },
    { key: 'doing', label: 'กำลังทำ', value: count('doing'), bar: 'bg-warning-500', text: 'text-warning-700' },
    { key: 'todo', label: 'ยังไม่เริ่ม', value: count('todo'), bar: 'bg-ink-300' },
    { key: 'blocked', label: 'ติดปัญหา', value: count('blocked'), bar: 'bg-danger-500' },
  ].filter((s) => s.key !== 'blocked' || s.value > 0)

  return (
    <>
      <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-surface-100">
        {segments.map((s) => (
          <span key={s.key} className={s.bar} style={{ width: `${(s.value / total) * 100}%` }} />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3.5 gap-y-1 text-xs text-ink-600">
        {segments.map((s) => (
          <span key={s.key} className={`inline-flex items-center gap-1.5 ${colorLabels && 'text' in s ? s.text : ''}`}>
            <span className={`h-2 w-2 rounded-full ${s.bar}`} />
            {s.label} {s.value}
          </span>
        ))}
      </div>
    </>
  )
}
