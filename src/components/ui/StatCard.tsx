import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: 'neutral' | 'default' | 'warning' | 'danger' | 'success'
}

const TONE_STYLES: Record<NonNullable<StatCardProps['tone']>, { card: string; icon: string }> = {
  neutral: { card: 'bg-accent-600/15 ring-accent-600/10', icon: 'text-accent-600' },
  default: { card: 'bg-primary-600/15 ring-primary-600/10', icon: 'text-primary-600' },
  success: { card: 'bg-success-600/15 ring-success-600/10', icon: 'text-success-600' },
  warning: { card: 'bg-warning-600/15 ring-warning-600/10', icon: 'text-warning-600' },
  danger: { card: 'bg-danger-600/15 ring-danger-600/10', icon: 'text-danger-600' },
}

export function StatCard({ label, value, icon: Icon, tone = 'neutral' }: StatCardProps) {
  const styles = TONE_STYLES[tone]
  return (
    <div
      className={`group relative overflow-hidden rounded-lg p-4 shadow-sm ring-1 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${styles.card}`}
    >
      <div className="flex items-center gap-2">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface/70 shadow-sm ${styles.icon}`}>
          <Icon size={18} />
        </div>
        <p className="truncate text-xs font-semibold text-ink-700">{label}</p>
      </div>
      <p className="mt-4 text-3xl font-bold tabular-nums text-ink-900">{value}</p>
    </div>
  )
}
