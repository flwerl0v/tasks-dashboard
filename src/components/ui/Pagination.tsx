import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}

function pageList(current: number, total: number): Array<number | '...'> {
  const delta = 1
  const middle: number[] = []
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) middle.push(i)

  const result: Array<number | '...'> = [1]
  if (middle[0] > 2) result.push('...')
  result.push(...middle)
  if (middle.length === 0 ? total > 2 : middle[middle.length - 1] < total - 1) result.push('...')
  if (total > 1) result.push(total)
  return result
}

export function Pagination({ page, pageCount, onPageChange }: PaginationProps) {
  if (pageCount <= 1) return null
  const pages = pageList(page, pageCount)

  return (
    <nav className="flex items-center justify-center gap-1 pt-4" aria-label="Pagination">
      <button
        type="button"
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-md p-1.5 text-ink-400 hover:bg-surface-50 disabled:opacity-30"
        aria-label="หน้าก่อนหน้า"
      >
        <ChevronLeft size={15} />
      </button>
      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`dots-${i}`} className="px-1.5 text-xs text-ink-300">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`h-7 w-7 rounded-md text-xs font-medium tabular-nums ${
              p === page ? 'bg-primary-600 text-white' : 'text-ink-500 hover:bg-surface-50'
            }`}
          >
            {p}
          </button>
        ),
      )}
      <button
        type="button"
        disabled={page === pageCount}
        onClick={() => onPageChange(page + 1)}
        className="rounded-md p-1.5 text-ink-400 hover:bg-surface-50 disabled:opacity-30"
        aria-label="หน้าถัดไป"
      >
        <ChevronRight size={15} />
      </button>
    </nav>
  )
}
