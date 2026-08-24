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
}

export function SearchInput({ value, onChange, placeholder = 'ค้นหา...', wrapperClassName = '', size = 'md' }: SearchInputProps) {
  const s = SIZE_CLASS[size]
  return (
    <div className={`relative ${wrapperClassName}`}>
      <Search size={s.icon} className={`pointer-events-none absolute ${s.iconLeft} top-1/2 -translate-y-1/2 text-ink-400`} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-2xl border border-slate-200 bg-white px-3 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${s.input}`}
      />
    </div>
  )
}
