import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  tone?: 'neutral' | 'default' | 'warning' | 'danger' | 'success'
}

const TONE_STYLES: Record<NonNullable<StatCardProps['tone']>, { icon: string; value: string }> = {
  neutral: { icon: 'bg-slate-100 text-slate-600', value: 'text-slate-900' },
  default: { icon: 'bg-blue-50 text-blue-600', value: 'text-blue-600' },
  success: { icon: 'bg-emerald-50 text-emerald-600', value: 'text-emerald-600' },
  warning: { icon: 'bg-amber-50 text-amber-600', value: 'text-amber-600' },
  danger: { icon: 'bg-rose-50 text-rose-600', value: 'text-rose-600' },
}

export function StatCard({ label, value, icon: Icon, tone = 'neutral' }: StatCardProps) {
  const styles = TONE_STYLES[tone]
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className={`mt-1 text-2xl font-bold ${styles.value}`}>{value}</p>
      </div>
      <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${styles.icon}`}>
        <Icon size={20} />
      </div>
    </div>
  )
}
