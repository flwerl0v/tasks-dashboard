import { useAppData } from '../../context/AppDataContext'
import { CreateTaskButton } from './CreateTaskButton'

interface TopbarProps {
  title: string
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { isSupabaseConfigured, loading, now } = useAppData()
  const today = now.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 min-h-20 border-b border-border bg-surface px-4 py-2 md:h-20 md:px-8 md:py-0">
      <div>
        <h1 className="text-lg font-bold text-ink-900 md:text-xl">{title}</h1>
        {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-4 whitespace-nowrap text-xs">
        <span className="text-ink-600">{today}</span>
        <span className="h-4 w-px shrink-0 bg-border-300" aria-hidden />
        <span className={`inline-flex items-center gap-1.5 font-medium ${isSupabaseConfigured ? 'text-ink-500' : 'text-warning-700'}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isSupabaseConfigured ? 'bg-success-500' : 'bg-warning-500'}`} />
          {loading ? 'กำลังโหลด...' : isSupabaseConfigured ? 'Supabase Connected' : 'ยังไม่ได้ตั้งค่า Supabase'}
        </span>
        <CreateTaskButton />
      </div>
    </header>
  )
}
