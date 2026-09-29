import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { inputClass } from './formStyles'

interface MenuPosition {
  left: number
  top: number
  width: number
}

interface SuggestInputProps {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder?: string
  className?: string
  autoFocus?: boolean
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
}

/**
 * Free-text input with a custom-styled, portal-based suggestion dropdown — the styled
 * equivalent of a native <input list="..."> + <datalist>, which can't be themed and renders
 * with browser-default chrome that clashes with the rest of the app's dropdowns.
 */
export function SuggestInput({ value, onChange, suggestions, placeholder, className = '', autoFocus, onKeyDown }: SuggestInputProps) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [position, setPosition] = useState<MenuPosition | null>(null)

  const query = value.trim().toLowerCase()
  const uniqueSuggestions = [...new Set(suggestions)]
  const matches = !query
    ? uniqueSuggestions.slice(0, 8)
    : uniqueSuggestions
        .map((item) => ({ item, at: item.toLowerCase().indexOf(query) }))
        .filter(({ item, at }) => at !== -1 && item.toLowerCase() !== query)
        .sort((a, b) => a.at - b.at || a.item.length - b.item.length)
        .map(({ item }) => item)
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
    <div ref={wrapperRef} className={`relative ${className}`}>
      <input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
          onKeyDown?.(e)
        }}
        placeholder={placeholder}
        className={inputClass}
        autoFocus={autoFocus}
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
                className="block w-full truncate px-3.5 py-2 text-left text-sm text-ink-700 transition-colors hover:bg-surface-50"
              >
                {item}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  )
}
