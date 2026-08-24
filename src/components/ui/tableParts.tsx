import type { ReactNode } from 'react'
import { ArrowUpDown, Plus, Search, Trash2 } from 'lucide-react'
import { DropdownSelect } from './DropdownSelect'
import { SearchInput } from './SearchInput'
import { selectClass } from './formStyles'
import type { SortDir } from '../../lib/useTableState'

export function SortHeader({
  label,
  sortKey,
  activeKey,
  onSort,
}: {
  label: string
  sortKey: string
  activeKey: string | null
  dir: SortDir
  onSort: (key: string) => void
}) {
  const active = activeKey === sortKey
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="flex items-center gap-1 font-medium text-ink-500 hover:text-ink-700"
    >
      {label}
      <ArrowUpDown size={12} className={active ? 'text-primary-600' : 'text-ink-300'} />
    </button>
  )
}

export function TableHeadRow({ children, shaded }: { children: ReactNode; shaded?: boolean }) {
  return (
    <tr className={`border-b border-border-100 text-xs text-ink-400 ${shaded ? 'bg-surface-50' : ''}`}>
      {children}
    </tr>
  )
}

export function TableBodyRow({
  children,
  hoverable,
  zebra,
}: {
  children: ReactNode
  hoverable?: boolean
  /** Shade this row with a subtle tint — pass `index % 2 === 1` for alternating rows. */
  zebra?: boolean
}) {
  return (
    <tr
      className={`border-b border-border-50 last:border-0 transition-colors ${zebra ? 'bg-surface-50/60' : ''} ${hoverable ? 'hover:bg-surface-100/70' : ''}`}
    >
      {children}
    </tr>
  )
}

export function TableToolbar({
  search,
  onSearchChange,
  createLabel,
  onCreate,
}: {
  search: string
  onSearchChange: (v: string) => void
  createLabel: string
  onCreate: () => void
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <SearchInput value={search} onChange={onSearchChange} placeholder="ค้นหา..." wrapperClassName="w-full max-w-xs" />
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 transition-colors hover:bg-slate-50"
      >
        <Plus size={14} />
        {createLabel}
      </button>
    </div>
  )
}

export function SelectionBar({ count, onDelete, onClear }: { count: number; onDelete: () => void; onClear: () => void }) {
  if (count === 0) return null
  return (
    <div className="mb-3 flex items-center justify-between rounded-lg border border-primary-100 bg-primary-50 px-4 py-2.5 text-sm">
      <span className="font-medium text-primary-700">เลือกแล้ว {count} รายการ</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-md bg-danger-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-danger-700"
        >
          <Trash2 size={13} />
          ลบที่เลือก
        </button>
        <button type="button" onClick={onClear} className="text-xs font-medium text-ink-500 hover:underline">
          ยกเลิกการเลือก
        </button>
      </div>
    </div>
  )
}

export function TableFooter({
  page,
  pageSize,
  total,
  onPageSizeChange,
}: {
  page: number
  pageSize: number
  total: number
  onPageSizeChange: (n: number) => void
}) {
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
      <p className="text-xs text-ink-400">
        แสดงผล {from}-{to} จากทั้งหมด {total} รายการ
      </p>
      <div className="flex items-center gap-3 text-xs text-ink-400">
        <span>แถวต่อหน้า</span>
        <DropdownSelect
          value={String(pageSize)}
          options={[10, 25, 50].map((n) => ({ value: String(n), label: String(n) }))}
          onChange={(value) => onPageSizeChange(Number(value))}
          label={String(pageSize)}
          className="w-auto"
          buttonClassName="min-w-[5rem]"
        />
      </div>
    </div>
  )
}
