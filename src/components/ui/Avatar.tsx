import { UserX } from 'lucide-react'
import { getTeamBadgeStyle } from '../../lib/teamColor'
import type { Member } from '../../types'

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function Avatar({ name, id, size = 26 }: { name: string; id: string; size?: number }) {
  const style = getTeamBadgeStyle(id)
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white ${style.bg} ${style.text}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.4) }}
    >
      {initials(name)}
    </span>
  )
}

/**
 * Table-cell owner display: an assigned owner's avatar + name, or — deliberately not just a plain
 * "-" — a warning-colored "ยังไม่มอบหมาย" flag, so an unassigned task (especially one that's also
 * overdue/due-soon) is easy to spot at a glance instead of blending into the row.
 */
export function OwnerCell({ owner }: { owner: Member | null | undefined }) {
  if (owner) {
    return (
      <div className="flex items-center gap-2">
        <div className="rounded-full shadow-sm ring-2 ring-white">
          <Avatar id={owner.id} name={owner.name} size={24} />
        </div>
        <span className="truncate text-ink-600">{owner.name}</span>
      </div>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-warning-100 py-1 pl-1 pr-2.5 text-xs font-bold text-warning-700">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-warning-500 text-white">
        <UserX size={12} />
      </span>
      ยังไม่มอบหมาย
    </span>
  )
}
