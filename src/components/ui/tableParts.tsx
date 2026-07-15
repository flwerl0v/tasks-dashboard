import { ArrowUpDown, Plus, Search, Trash2 } from 'lucide-react'
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
      className="flex items-center gap-1 font-medium text-slate-500 hover:text-slate-700"
    >
      {label}
      <ArrowUpDown size={12} className={active ? 'text-blue-600' : 'text-slate-300'} />
    </button>
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
      <div className="relative w-full max-w-xs">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="ค้นหา..."
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400"
        />
      </div>
      <button
        type="button"
        onClick={onCreate}
        className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
      >
        <Plus size={15} />
        {createLabel}
      </button>
    </div>
  )
}

export function SelectionBar({ count, onDelete, onClear }: { count: number; onDelete: () => void; onClear: () => void }) {
  if (count === 0) return null
  return (
    <div className="mb-3 flex items-center justify-between rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5 text-sm">
      <span className="font-medium text-blue-700">เลือกแล้ว {count} รายการ</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
        >
          <Trash2 size={13} />
          ลบที่เลือก
        </button>
        <button type="button" onClick={onClear} className="text-xs font-medium text-slate-500 hover:underline">
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
      <p className="text-xs text-slate-400">
        แสดงผล {from}-{to} จากทั้งหมด {total} รายการ
      </p>
      <label className="flex items-center gap-2 text-xs text-slate-400">
        แถวต่อหน้า
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-600 outline-none focus:border-blue-400"
        >
          {[10, 25, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
