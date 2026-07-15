import { useMemo, useState } from 'react'

export type SortDir = 'asc' | 'desc'

/** Sort + paginate + row-selection for an admin table. Search filtering happens upstream (it's domain-specific per panel). */
export function useTableState<T extends { id: string }>(
  items: T[],
  getSortValue: (item: T, key: string) => string | number,
  initialPageSize = 10,
) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSizeState] = useState(initialPageSize)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const setPageSize = (n: number) => {
    setPageSizeState(n)
    setPage(1)
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = (ids: string[]) => {
    setSelected((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id))
      const next = new Set(prev)
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)))
      return next
    })
  }

  const clearSelection = () => setSelected(new Set())

  const sorted = useMemo(() => {
    if (!sortKey) return items
    const copy = [...items]
    copy.sort((a, b) => {
      const av = getSortValue(a, sortKey)
      const bv = getSortValue(b, sortKey)
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [items, sortKey, sortDir, getSortValue])

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize))
  const clampedPage = Math.min(page, pageCount)
  const paged = useMemo(
    () => sorted.slice((clampedPage - 1) * pageSize, clampedPage * pageSize),
    [sorted, clampedPage, pageSize],
  )

  return {
    sortKey,
    sortDir,
    toggleSort,
    page: clampedPage,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    total: sorted.length,
    selected,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    paged,
  }
}
