import {
  BarChart3,
  BrainCircuit,
  LayoutDashboard,
  ListChecks,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
  Download,
  TrendingUp,
  UserCircle,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'

const NAV_SECTIONS = [
  {
    label: 'Quick Access',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/tasks', label: 'Tasks', icon: ListChecks },
      { to: '/team', label: 'Team', icon: Users },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/workload', label: 'Workload (AI)', icon: BrainCircuit },
      { to: '/reports', label: 'Reports', icon: BarChart3 },
      { to: '/export', label: 'Export', icon: Download },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/admin', label: 'Admin', icon: ShieldCheck },
      { to: '/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
]

export function Sidebar() {
  return (
    <aside className="flex w-16 shrink-0 flex-col border-r border-border bg-surface md:w-64">
      <div className="flex items-center gap-2.5 px-3 py-5 md:px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white shadow-lg shadow-primary-900/30">
          <TrendingUp size={18} />
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-bold uppercase tracking-wide leading-tight text-ink-900">Manager</p>
          <p className="text-[11px] text-ink-500">Task &amp; Team Tracking</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-2 py-3 md:px-3">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="hidden px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500 md:block">
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  title={label}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-ink-500 hover:bg-surface-100 hover:text-ink-900'
                    }`
                  }
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="hidden md:inline">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="hidden items-center gap-2.5 border-t border-border px-4 py-4 md:flex">
        <UserCircle size={28} className="shrink-0 text-ink-500" />
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-ink-700">efinanceThai</p>
          <p className="truncate text-[11px] text-ink-500">Internal Tool</p>
        </div>
      </div>
    </aside>
  )
}
