import type { ReactNode } from 'react'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface AsyncStateProps {
  loading: boolean
  error: string | null
  children: ReactNode
}

export function AsyncState({ loading, error, children }: AsyncStateProps) {
  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-slate-400">
        <Loader2 className="animate-spin" size={28} />
        <p className="text-sm">กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-rose-500">
        <AlertTriangle size={28} />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return <>{children}</>
}
