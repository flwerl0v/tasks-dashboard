import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  /** Small uppercase English tag above the label, same voice as the sidebar section headings. Without it the label takes the top row. */
  eyebrow?: string
  value: string | number
  icon: LucideIcon
  /** Shown as "/total" after the number, so the card reads as a share of the whole. */
  total?: number
  /** Small line under the number, e.g. its share of the total. */
  hint?: string
  tone?: 'neutral' | 'default' | 'warning' | 'danger' | 'success'
}

// One hue per tone, shared with the status legend in the charts below: eyebrow + number use the 700 shade, the icon the 500.
const TONE: Record<NonNullable<StatCardProps['tone']>, { icon: string; text: string }> = {
  neutral: { icon: 'text-ink-400', text: 'text-ink-700' },
  default: { icon: 'text-primary-500', text: 'text-primary-700' },
  success: { icon: 'text-success-500', text: 'text-success-700' },
  warning: { icon: 'text-warning-500', text: 'text-warning-700' },
  danger: { icon: 'text-danger-500', text: 'text-danger-700' },
}

export function StatCard({ label, eyebrow, value, icon: Icon, total, hint, tone = 'neutral' }: StatCardProps) {
  // "Overdue" only takes its red hue when there is something to act on; at zero it falls back to the neutral hue.
  const t = TONE[tone === 'danger' && Number(value) === 0 ? 'neutral' : tone]
  return (
    <div className="rounded-md border border-border bg-surface px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        {eyebrow ? (
          <span className={`text-[11px] font-semibold uppercase tracking-[0.08em] ${t.text}`}>{eyebrow}</span>
        ) : (
          <p className="truncate text-sm font-medium text-ink-600">{label}</p>
        )}
        <Icon size={18} className={`shrink-0 ${t.icon}`} />
      </div>
      {eyebrow && <p className="mt-1.5 truncate text-sm font-medium text-ink-600">{label}</p>}
      <p className={`${eyebrow ? 'mt-1.5' : 'mt-3'} text-4xl font-semibold tabular-nums ${t.text}`}>
        {value}
        {total !== undefined && <span className="ml-1 text-base font-medium text-ink-400">/{total}</span>}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  )
}
