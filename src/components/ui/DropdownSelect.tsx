import { useEffect, useRef, useState } from 'react'
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
  const [flipUp, setFlipUp] = useState(false)

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) {
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
      const menu = menuRef.current
      if (!el || !menu) return
      const rect = el.getBoundingClientRect()
      const menuHeight = Math.min(menu.offsetHeight || 0, window.innerHeight * 0.6)
      const spaceBelow = window.innerHeight - rect.bottom
      setFlipUp(spaceBelow < menuHeight + 8)
    }

    // calculate once and on scroll/resize
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
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
      {open && (
        <div
          ref={menuRef}
          className={`absolute left-0 z-20 min-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg ${
            flipUp ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          style={{ maxHeight: '60vh' }}
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
        </div>
      )}
    </div>
  )
}
