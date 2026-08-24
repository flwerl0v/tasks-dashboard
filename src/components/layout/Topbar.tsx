import { useAppData } from '../../context/AppDataContext'

interface TopbarProps {
  title: string
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { isSupabaseConfigured, loading } = useAppData()
  const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-4 md:px-8">
      <div>
        <h1 className="text-lg font-bold text-ink-900 md:text-xl">{title}</h1>
        {subtitle && <p className="text-sm text-ink-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-ink-400">{today}</span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${
            isSupabaseConfigured ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isSupabaseConfigured ? 'bg-success-500' : 'bg-warning-500'}`} />
          {loading ? 'กำลังโหลด...' : isSupabaseConfigured ? 'Supabase Connected' : 'ยังไม่ได้ตั้งค่า Supabase'}
        </span>
      </div>
    </header>
  )
}
