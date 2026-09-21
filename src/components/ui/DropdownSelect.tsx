import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { selectClass } from './formStyles'

export interface DropdownOption<T extends string = string> {
  value: T
  label: string
  /** Tailwind bg-* class for a small color dot next to the label (e.g. status/priority color-coding). */
  dotClassName?: string
  /** Tailwind text-* class applied to the label when this option is the selected one. */
  accentClassName?: string
}

interface DropdownSelectProps<T extends string> {
  value: T
  options: DropdownOption<T>[]
  onChange: (value: T) => void
  label: string
  className?: string
  fullWidth?: boolean
  buttonClassName?: string
}

interface MenuPosition {
  left: number
  minWidth: number
  // Exactly one of these is set, matching whichever side has room.
  top?: number
  bottom?: number
}

export function DropdownSelect<T extends string>({
  value,
  options,
  onChange,
  label,
  className = '',
  fullWidth = false,
  buttonClassName = '',
}: DropdownSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<MenuPosition | null>(null)

  useEffect(() => {
    if (!open) return
    // Menu is portaled to <body>, so it's a sibling of `ref`'s subtree, not a descendant —
    // a click inside it must count as "inside" too, or it'd close before its own onClick fires.
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  useEffect(() => {
    if (!open) return
    const updatePosition = () => {
      const el = ref.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const menuHeight = Math.min(menuRef.current?.offsetHeight || 0, window.innerHeight * 0.6)
      const spaceBelow = window.innerHeight - rect.bottom
      const flipUp = spaceBelow < menuHeight + 8
      setPosition({
        left: rect.left,
        minWidth: rect.width,
        ...(flipUp ? { bottom: window.innerHeight - rect.top + 8 } : { top: rect.bottom + 8 }),
      })
    }

    // calculate once (menu isn't rendered yet on the very first tick, so run again after mount)
    // and keep it pinned to the trigger on scroll/resize.
    updatePosition()
    const raf = requestAnimationFrame(updatePosition)
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  const selectedOption = options.find((opt) => opt.value === value)
  const selectedLabel = selectedOption?.label ?? label

  return (
    <div ref={ref} className={`relative ${fullWidth ? 'w-full' : 'inline-block'} ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`${selectClass} inline-flex ${fullWidth ? 'w-full' : 'w-auto min-w-fit max-w-[12rem]'} items-center gap-2 text-left ${buttonClassName}`}
      >
        {selectedOption?.dotClassName && <span className={`h-2 w-2 shrink-0 rounded-full ${selectedOption.dotClassName}`} />}
        <span className={`truncate max-w-full whitespace-nowrap text-sm font-medium ${selectedOption?.accentClassName ?? 'text-slate-700'}`}>
          {selectedLabel}
        </span>
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="fixed z-[100] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
            style={{
              maxHeight: '60vh',
              left: position?.left ?? 0,
              minWidth: position?.minWidth ?? 0,
              top: position?.top,
              bottom: position?.bottom,
              // Keep it off-screen (but still measurable) until position is computed, to avoid a flash at (0,0).
              visibility: position ? 'visible' : 'hidden',
            }}
          >
            {options.map((option) => {
              const active = option.value === value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center gap-2 whitespace-nowrap px-3 py-2 text-left text-sm transition-colors ${
                    active ? `bg-slate-50 font-semibold ${option.accentClassName ?? 'text-slate-900'}` : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {option.dotClassName && <span className={`h-2 w-2 shrink-0 rounded-full ${option.dotClassName}`} />}
                  {option.label}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </div>
  )
}
