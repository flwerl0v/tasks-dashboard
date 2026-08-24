import { getTeamBadgeStyle } from '../../lib/teamColor'

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
