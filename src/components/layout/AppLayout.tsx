import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

const PAGE_META: Record<string, { title: string; subtitle?: string }> = {
  '/': { title: 'Dashboard', subtitle: 'ภาพรวมงานทั้งหมดและภาระงานของทีม' },
  '/tasks': { title: 'Tasks', subtitle: 'รายการงานทั้งหมด ค้นหาและกรองได้' },
  '/team': { title: 'Team', subtitle: 'ทีมและสมาชิกทั้งหมด' },
  '/workload': { title: 'Workload (AI)', subtitle: 'ประเมินภาระงานรายบุคคลด้วย AI' },
  '/reports': { title: 'Reports', subtitle: 'สรุปสถิติเชิงลึกของงานทั้งหมด' },
  '/export': { title: 'Export', subtitle: 'ส่งออกผลลัพธ์เป็นไฟล์ Excel' },
  '/admin': { title: 'Admin', subtitle: 'สร้างและจัดการทีมทั้งหมด' },
  '/settings': { title: 'Settings', subtitle: 'การเชื่อมต่อ Supabase และ AI Summary' },
}

export function AppLayout() {
  const location = useLocation()
  const meta = PAGE_META[location.pathname] ??
    (location.pathname.startsWith('/admin/teams/')
      ? { title: 'รายละเอียดทีม', subtitle: 'ข้อมูลทีม งาน และสมาชิก' }
      : { title: 'Manager Dashboard' })

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={meta.title} subtitle={meta.subtitle} />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
