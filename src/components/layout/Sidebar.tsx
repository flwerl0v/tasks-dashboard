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
    <aside className="flex w-16 shrink-0 flex-col border-r border-border bg-gradient-to-b from-surface to-surface-50 md:w-64">
      <div className="flex items-center gap-2.5 border-b border-border/70 px-3 py-5 md:px-5">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-indigo-600 text-white shadow-lg shadow-primary-600/30 ring-1 ring-white/40">
          <TrendingUp size={19} />
        </div>
        <div className="hidden md:block">
          <p className="text-sm font-bold uppercase tracking-wide leading-tight text-ink-900">Manager</p>
          <p className="text-[11px] text-ink-500">Task &amp; Team Tracking</p>
        </div>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-2 py-4 md:px-3">
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
                    `group flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-ink-600 hover:bg-surface-100 hover:text-ink-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-colors duration-150 ${
                          isActive
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-surface-100 text-ink-600 group-hover:bg-surface-200 group-hover:text-ink-900'
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="hidden md:inline">{label}</span>
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="hidden border-t border-border/70 p-3 md:block">
        <div className="flex items-center gap-2.5 rounded-xl bg-surface-100 px-2.5 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 text-xs font-semibold text-white shadow-sm">
            E
          </div>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold text-ink-800">efinanceThai</p>
            <p className="truncate text-[11px] text-ink-500">Internal Tool</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
