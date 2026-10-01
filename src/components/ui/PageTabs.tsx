export interface PageTabItem<K extends string> {
  key: K
  label: string
  count: number
}

interface PageTabsProps<K extends string> {
  tabs: PageTabItem<K>[]
  active: K
  onChange: (key: K) => void
}

/** Underline tabs with a count pill — the same look as the tabs on the team detail page, in the blue accent. */
export function PageTabs<K extends string>({ tabs, active, onChange }: PageTabsProps<K>) {
  return (
    <div className="mb-4 flex gap-7 border-b border-border">
      {tabs.map(({ key, label, count }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          className={`-mb-px border-b-2 py-2.5 text-sm font-medium transition-colors ${
            active === key ? 'border-primary-500 text-ink-900' : 'border-transparent text-ink-500 hover:text-ink-900'
          }`}
        >
          {label}
          <span className={`ml-2 rounded-full px-1.5 py-0.5 text-xs tabular-nums ${active === key ? 'bg-primary-500 text-white' : 'bg-surface-100 text-ink-500'}`}>
            {count}
          </span>
        </button>
      ))}
    </div>
  )
}
