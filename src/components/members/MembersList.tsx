import { useMemo, useState } from 'react'
import { LayoutGrid, List } from 'lucide-react'
import { Avatar } from '../ui/Avatar'
import { SearchInput } from '../ui/SearchInput'
import { DropdownSelect } from '../ui/DropdownSelect'
import { getTeamBadgeStyle } from '../../lib/teamColor'
import { nameInitial } from '../../lib/nameInitial'
import type { Member, Team } from '../../types'

type MemberView = 'list' | 'grid'

function TeamChip({ team }: { team: Team }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-50 py-0.5 pl-1 pr-2.5 text-[13px] text-ink-700">
      <span className={`flex h-4 w-4 items-center justify-center rounded text-[9.5px] font-bold text-white ${getTeamBadgeStyle(team.id).solid}`}>
        {nameInitial(team.name)}
      </span>
      {team.name}
    </span>
  )
}

interface MembersListProps {
  members: Member[]
  teams: Team[]
  /** Called with the member and their team when a row/card is clicked (members without a team can't be opened). */
  onOpenMember: (member: Member, team: Team) => void
}

/** Plain "who is on which team" view shared by the Team and Admin pages. Details live on the team's own page. */
export function MembersList({ members, teams, onOpenMember }: MembersListProps) {
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [view, setView] = useState<MemberView>('list')

  const teamById = useMemo(() => new Map(teams.map((tm) => [tm.id, tm])), [teams])

  const teamOptions = useMemo(
    () => [{ value: '', label: 'ทุกทีม' }, ...[...teams].sort((a, b) => a.name.localeCompare(b.name)).map((tm) => ({ value: tm.id, label: tm.name }))],
    [teams],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return members
      .filter((m) => {
        if (teamFilter && m.team_id !== teamFilter) return false
        if (q && !m.name.toLowerCase().includes(q) && !(m.email ?? '').toLowerCase().includes(q)) return false
        return true
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'th'))
  }, [members, search, teamFilter])

  const open = (member: Member) => {
    const team = member.team_id ? teamById.get(member.team_id) : undefined
    if (team) onOpenMember(member, team)
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput value={search} onChange={setSearch} placeholder="ค้นหาสมาชิก" wrapperClassName="w-full sm:w-64" />
        <DropdownSelect value={teamFilter} className="shrink-0" label="ทุกทีม" options={teamOptions} onChange={(value) => setTeamFilter(value)} />
        <div className="ml-auto inline-flex overflow-hidden rounded-md border border-border" role="group" aria-label="รูปแบบการแสดงผล">
          {(
            [
              { key: 'list', label: 'รายการ', icon: List },
              { key: 'grid', label: 'ตาราง', icon: LayoutGrid },
            ] as const
          ).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setView(key)}
              aria-pressed={view === key}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[13px] transition-colors ${
                view === key ? 'bg-ink-900 text-white' : 'bg-surface text-ink-500 hover:text-ink-900'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-ink-400">{search || teamFilter ? 'ไม่พบสมาชิกที่ตรงกับเงื่อนไข' : 'ยังไม่มีสมาชิก'}</p>
      ) : view === 'list' ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-primary-50 text-[11px] tracking-wide text-primary-700">
                <th className="px-3.5 py-2 text-left font-semibold">สมาชิก</th>
                <th className="px-3.5 py-2 text-left font-semibold">ทีม</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => {
                const team = member.team_id ? teamById.get(member.team_id) : undefined
                return (
                  <tr key={member.id} onClick={() => open(member)} className={`border-t border-surface-100 ${team ? 'cursor-pointer hover:bg-surface-50' : ''}`}>
                    <td className="px-3.5 py-2.5">
                      <div className="flex items-center gap-2.5 font-medium text-ink-900">
                        <Avatar id={member.id} name={member.name} size={30} />
                        {member.name}
                      </div>
                    </td>
                    <td className="px-3.5 py-2.5">{team ? <TeamChip team={team} /> : <span className="text-ink-400">ยังไม่มีทีม</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((member) => {
            const team = member.team_id ? teamById.get(member.team_id) : undefined
            const style = getTeamBadgeStyle(team?.id)
            return (
              <button
                key={member.id}
                type="button"
                disabled={!team}
                onClick={() => open(member)}
                className="overflow-hidden rounded-lg border border-border bg-surface text-center transition-colors enabled:hover:border-border-300 disabled:cursor-default"
              >
                <div className={`h-11 border-b border-border ${style.soft}`} />
                <span className="relative -mt-7 inline-block">
                  <Avatar id={member.id} name={member.name} size={52} />
                </span>
                <span className="mt-2 block px-3 text-sm font-semibold text-ink-900">{member.name}</span>
                <span className={`mb-3.5 mt-1 inline-flex items-center gap-1.5 text-[12.5px] font-medium ${team ? style.text : 'text-ink-500'}`}>
                  {team ? (
                    <>
                      <span className={`flex h-[15px] w-[15px] items-center justify-center rounded text-[9px] font-bold text-white ${style.solid}`}>
                        {nameInitial(team.name)}
                      </span>
                      {team.name}
                    </>
                  ) : (
                    'ยังไม่มีทีม'
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
