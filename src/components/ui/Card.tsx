import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function Card({ title, action, children, className = '' }: CardProps) {
  return (
    <div className={`rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md ${className}`}>
      {title && (
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-ink-800">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}
