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
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-400 transition-colors hover:bg-surface-100 hover:text-ink-600"
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
        <div className="absolute right-0 z-20 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-lg">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium hover:bg-surface-50 ${
                item.danger ? 'text-danger-600' : 'text-ink-700'
              }`}
            >
              {item.icon && <item.icon size={13} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
