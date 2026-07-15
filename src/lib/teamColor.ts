const TEAM_BADGE_COLORS = [
  { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-t-blue-500', solid: 'bg-blue-500', from: 'from-blue-500', to: 'to-blue-400' },
  { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-500', border: 'border-t-violet-500', solid: 'bg-violet-500', from: 'from-violet-500', to: 'to-violet-400' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-t-emerald-500', solid: 'bg-emerald-500', from: 'from-emerald-500', to: 'to-emerald-400' },
  { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-t-amber-500', solid: 'bg-amber-500', from: 'from-amber-500', to: 'to-amber-400' },
  { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', border: 'border-t-rose-500', solid: 'bg-rose-500', from: 'from-rose-500', to: 'to-rose-400' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', dot: 'bg-cyan-500', border: 'border-t-cyan-500', solid: 'bg-cyan-500', from: 'from-cyan-500', to: 'to-cyan-400' },
  { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500', border: 'border-t-orange-500', solid: 'bg-orange-500', from: 'from-orange-500', to: 'to-orange-400' },
  { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500', border: 'border-t-teal-500', solid: 'bg-teal-500', from: 'from-teal-500', to: 'to-teal-400' },
]

/** Assigns each team a stable color from a fixed categorical set, based on its id. */
export function getTeamBadgeStyle(teamId: string | null | undefined) {
  if (!teamId) {
    return {
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      dot: 'bg-slate-400',
      border: 'border-t-slate-300',
      solid: 'bg-slate-400',
      from: 'from-slate-400',
      to: 'to-slate-300',
    }
  }
  let hash = 0
  for (let i = 0; i < teamId.length; i++) hash = (hash * 31 + teamId.charCodeAt(i)) >>> 0
  return TEAM_BADGE_COLORS[hash % TEAM_BADGE_COLORS.length]
}
