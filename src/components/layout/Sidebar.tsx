import {
  BarChart3,
  BrainCircuit,
  LayoutDashboard,
  ListChecks,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
  Download,
  LineChart,
  UserCircle,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/workload', label: 'Workload (AI)', icon: BrainCircuit },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/export', label: 'Export', icon: Download },
  { to: '/admin', label: 'Admin', icon: ShieldCheck },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export function Sidebar() {
  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-slate-800 bg-slate-900 md:w-60">
      <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-5 md:px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <LineChart size={18} />
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-bold leading-tight text-white">Manager Dashboard</p>
          <p className="text-xs text-slate-400">Task &amp; Team Tracking</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4 md:px-3">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            <span className="hidden md:inline">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="hidden items-center gap-2.5 border-t border-slate-800 px-4 py-4 md:flex">
        <UserCircle size={28} className="shrink-0 text-slate-500" />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-200">efinanceThai</p>
          <p className="truncate text-[11px] text-slate-500">Internal Tool</p>
        </div>
      </div>
    </aside>
  )
}
