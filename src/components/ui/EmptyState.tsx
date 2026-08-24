import type { ReactNode } from 'react'

const PY_CLASS: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'py-6',
  md: 'py-8',
  lg: 'py-10',
}

interface EmptyStateProps {
  py?: 'sm' | 'md' | 'lg'
  className?: string
  children: ReactNode
}

export function EmptyState({ py = 'md', className = '', children }: EmptyStateProps) {
  return <p className={`text-center text-sm text-ink-400 ${PY_CLASS[py]} ${className}`}>{children}</p>
}
