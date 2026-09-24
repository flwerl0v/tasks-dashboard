import { useEffect, useRef, useState, type ComponentType } from 'react'
import { ChevronDown, MoreVertical } from 'lucide-react'

export interface ActionMenuItem {
  label: string
  icon?: ComponentType<{ size?: number }>
  onClick: () => void
  danger?: boolean
}

export function ActionMenu({ items, trigger = 'button' }: { items: ActionMenuItem[]; trigger?: 'button' | 'icon' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div className="relative inline-block text-left" ref={ref}>
      {trigger === 'icon' ? (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
            open ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-border bg-surface text-ink-500 hover:bg-surface-100 hover:text-ink-700'
          }`}
          aria-label="เปิดเมนู"
        >
          <MoreVertical size={16} />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink-600 hover:bg-surface-50"
        >
          Action
          <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      )}
      {open && (
        <div className="absolute right-0 z-20 mt-2 w-52 rounded-2xl border border-border bg-surface p-1.5 shadow-lg">
          {items.map((item, i) => (
            <div key={i}>
              {item.danger && i > 0 && !items[i - 1].danger && <div className="mx-1 my-1 h-px bg-border-100" />}
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  item.onClick()
                }}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium ${
                  item.danger ? 'text-danger-600 hover:bg-danger-50' : 'text-ink-700 hover:bg-surface-100'
                }`}
              >
                {item.icon && <item.icon size={15} />}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
