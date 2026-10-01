import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Users } from 'lucide-react'
import { useAppData } from '../context/AppDataContext'
import { AsyncState } from '../components/ui/AsyncState'
import { Card } from '../components/ui/Card'
import { PageTabs } from '../components/ui/PageTabs'
import { SearchInput } from '../components/ui/SearchInput'
import { DropdownSelect } from '../components/ui/DropdownSelect'
import { TeamCard } from '../components/teams/TeamCard'
import { MembersList } from '../components/members/MembersList'
import { AdminNavigateDialog } from '../components/ui/AdminNavigateDialog'
import { isOverdue } from '../lib/stats'
import type { Member, Task, Team } from '../types'

type PageTab = 'teams' | 'members'

export default function TeamPage() {
  const { teams, members, tasks, loading, error } = useAppData()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: PageTab = searchParams.get('tab') === 'members' ? 'members' : 'teams'
  const setTab = (next: PageTab) => setSearchParams(next === 'members' ? { tab: 'members' } : {}, { replace: true })

  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState('')
  const [pendingNavigateTeam, setPendingNavigateTeam] = useState<Team | null>(null)
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null)

  const membersByTeam = useMemo(() => {
    const map = new Map<string, Member[]>()
    members.forEach((m) => {
      if (!m.team_id) return
      map.set(m.team_id, [...(map.get(m.team_id) ?? []), m])
    })
    return map
  }, [members])

  const tasksByTeam = useMemo(() => {
    const map = new Map<string, Task[]>()
    tasks.forEach((tsk) => {
      if (!tsk.team_id) return
      map.set(tsk.team_id, [...(map.get(tsk.team_id) ?? []), tsk])
    })
    return map
  }, [tasks])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return teams.filter((tm) => {
      if (teamFilter && tm.id !== teamFilter) return false
      if (q && !tm.name.toLowerCase().includes(q)) return false
      return true
    })
  }, [teams, search, teamFilter])

  const pendingStats = useMemo(() => {
    if (!pendingNavigateTeam) return undefined
    const teamTasks = tasksByTeam.get(pendingNavigateTeam.id) ?? []
    return {
      members: (membersByTeam.get(pendingNavigateTeam.id) ?? []).length,
      doing: teamTasks.filter((t) => t.status === 'doing').length,
      overdue: teamTasks.filter(isOverdue).length,
    }
  }, [pendingNavigateTeam, membersByTeam, tasksByTeam])

  const closeDialog = () => {
    setPendingNavigateTeam(null)
    setPendingMemberId(null)
  }

  return (
    <AsyncState loading={loading} error={error}>
      <div className="space-y-4">
        <p className="text-sm text-ink-500">
          <span className="font-semibold text-ink-800">{teams.length} ทีม</span> · {members.length} สมาชิกทั้งหมด
        </p>

        <Card>
          <PageTabs
            tabs={[
              { key: 'teams', label: 'ทีม', count: teams.length },
              { key: 'members', label: 'สมาชิก', count: members.length },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === 'teams' ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <SearchInput value={search} onChange={setSearch} placeholder="ค้นหาทีม" wrapperClassName="w-56" />
                <DropdownSelect
                  value={teamFilter}
                  label="ทุกทีม"
                  options={[{ value: '', label: 'ทุกทีม' },
                    ...[...teams]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((tm) => ({ value: tm.id, label: tm.name }))]}
                  onChange={(value) => setTeamFilter(value)}
                />
              </div>

              {filtered.length === 0 ? (
                <p className="py-10 text-center text-ink-400">
                  {search || teamFilter ? 'ไม่พบทีมที่ตรงกับเงื่อนไข' : 'ยังไม่มีทีม — ไปที่หน้า Admin เพื่อเพิ่มทีมและสมาชิก'}
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filtered.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team}
                      members={membersByTeam.get(team.id) ?? []}
                      tasks={tasksByTeam.get(team.id) ?? []}
                      onOpen={() => setPendingNavigateTeam(team)}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <MembersList
              members={members}
              teams={teams}
              onOpenMember={(member, team) => {
                setPendingMemberId(member.id)
                setPendingNavigateTeam(team)
              }}
            />
          )}
        </Card>
      </div>
      <AdminNavigateDialog
        open={Boolean(pendingNavigateTeam)}
        from={{ label: 'Team', icon: Users }}
        team={pendingNavigateTeam}
        stats={pendingStats}
        onClose={closeDialog}
        onConfirm={() => {
          if (pendingNavigateTeam) {
            navigate(`/admin/teams/${pendingNavigateTeam.id}${pendingMemberId ? `?member=${pendingMemberId}` : ''}`)
          }
          closeDialog()
        }}
      />
    </AsyncState>
  )
}
