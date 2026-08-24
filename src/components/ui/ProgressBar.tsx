const SIZE_CLASS: Record<'sm' | 'md', string> = {
  sm: 'h-1.5',
  md: 'h-2',
}

const TONE_CLASS: Record<'primary' | 'success' | 'warning' | 'danger', string> = {
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  danger: 'bg-danger-500',
}

interface ProgressBarProps {
  value: number
  size?: 'sm' | 'md'
  tone?: 'primary' | 'success' | 'warning' | 'danger'
  className?: string
}

export function ProgressBar({ value, size = 'sm', tone = 'primary', className = '' }: ProgressBarProps) {
  return (
    <div className={`overflow-hidden rounded-full bg-surface-100 ${SIZE_CLASS[size]} ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${TONE_CLASS[tone]}`}
        style={{ width: `${value}%` }}
      />
    </div>
  )
}