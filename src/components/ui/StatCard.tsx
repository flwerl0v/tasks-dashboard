import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  /** Small line under the number, e.g. its share of the total. */
  hint?: string
  tone?: 'neutral' | 'default' | 'warning' | 'danger' | 'success'
}

// The dot uses the same hues as the status legend in the charts below, so a card and its chart segment read as the
// same thing. Only `danger` tints the whole card (and only when there is something to act on).
const DOT: Record<NonNullable<StatCardProps['tone']>, string> = {
  neutral: 'bg-ink-400',
  default: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
}

export function StatCard({ label, value, icon: Icon, hint, tone = 'neutral' }: StatCardProps) {
  const isAlert = tone === 'danger' && Number(value) > 0
  return (
    <div className={`rounded-md border px-5 py-4 ${isAlert ? 'border-danger-500/40 bg-danger-50' : 'border-border bg-surface'}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${DOT[tone]}`} aria-hidden />
          <p className="truncate text-sm font-medium text-ink-600">{label}</p>
        </div>
        <Icon size={18} className={`shrink-0 ${isAlert ? 'text-danger-600' : 'text-ink-400'}`} />
      </div>
      <p className={`mt-3 text-4xl font-semibold tabular-nums ${isAlert ? 'text-danger-700' : 'text-ink-900'}`}>{value}</p>
      {hint && <p className={`mt-1 text-xs ${isAlert ? 'text-danger-700/80' : 'text-ink-500'}`}>{hint}</p>}
    </div>
  )
}
