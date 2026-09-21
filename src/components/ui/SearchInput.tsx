import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search } from 'lucide-react'

const SIZE_CLASS: Record<'sm' | 'md', { icon: number; iconLeft: string; input: string }> = {
  md: { icon: 15, iconLeft: 'left-3', input: 'py-2 pl-9 pr-3 text-sm' },
  sm: { icon: 13, iconLeft: 'left-2.5', input: 'py-1.5 pl-7 pr-2 text-xs' },
}

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  wrapperClassName?: string
  size?: 'sm' | 'md'
  /**
   * Known values (task titles, names, ...) to offer as a pick-to-fill dropdown while typing.
   * Purely a shortcut — the input already live-filters on every keystroke either way, this
   * just saves typing the rest of a known name once there's a match.
   */
  suggestions?: string[]
}

interface MenuPosition {
  left: number
  top: number
  width: number
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'ค้นหา...',
  wrapperClassName = '',
  size = 'md',
  suggestions,
}: SearchInputProps) {
  const s = SIZE_CLASS[size]
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<MenuPosition | null>(null)

  const query = value.trim().toLowerCase()
  const matches = !suggestions || !query
    ? []
    : [...new Set(suggestions)]
        .filter((item) => item.toLowerCase().includes(query) && item.toLowerCase() !== query)
        .slice(0, 8)
  const showMenu = open && matches.length > 0

  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (!wrapperRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  useEffect(() => {
    if (!showMenu) return
    const updatePosition = () => {
      const el = wrapperRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      setPosition({ left: rect.left, top: rect.bottom + 6, width: rect.width })
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [showMenu])

  return (
    <div ref={wrapperRef} className={`relative ${wrapperClassName}`}>
      <Search size={s.icon} className={`pointer-events-none absolute ${s.iconLeft} top-1/2 -translate-y-1/2 text-ink-400`} />
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder={placeholder}
        className={`w-full rounded-2xl border border-border bg-surface px-3 outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 ${s.input}`}
      />
      {showMenu &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] overflow-y-auto rounded-2xl border border-border bg-surface shadow-lg"
            style={{ left: position?.left ?? 0, top: position?.top ?? 0, width: position?.width ?? 0, maxHeight: '50vh' }}
          >
            {matches.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onChange(item)
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-surface-50"
              >
                <Search size={12} className="shrink-0 text-ink-300" />
                <span className="truncate">{item}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
