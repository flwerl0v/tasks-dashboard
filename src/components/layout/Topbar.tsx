import { useAppData } from '../../context/AppDataContext'

interface TopbarProps {
  title: string
  subtitle?: string
}

export function Topbar({ title, subtitle }: TopbarProps) {
  const { isSupabaseConfigured, loading } = useAppData()
  const today = new Date().toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4 md:px-8">
      <div>
        <h1 className="text-lg font-bold text-slate-900 md:text-xl">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3 text-xs">
        <span className="text-slate-400">{today}</span>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${
            isSupabaseConfigured ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
          }`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${isSupabaseConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          {loading ? 'กำลังโหลด...' : isSupabaseConfigured ? 'Supabase Connected' : 'ยังไม่ได้ตั้งค่า Supabase'}
        </span>
      </div>
    </header>
  )
}
