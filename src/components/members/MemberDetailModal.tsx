import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ChevronRight, X } from 'lucide-react'
import { useAppData } from '../../context/AppDataContext'
import { DueDateChip, StatusBadge, WorkloadBadge } from '../ui/Badge'
import { ProgressBar } from '../ui/ProgressBar'
import { SearchInput } from '../ui/SearchInput'
import { getTeamBadgeStyle } from '../../lib/teamColor'
import { computeMemberWorkloads } from '../../lib/workload'

const SEARCH_THRESHOLD = 5

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
}

function StatTile({ value, label, toneClass }: { value: number; label: string; toneClass: string }) {
  return (
    <div className={`rounded-xl px-3 py-2.5 ${toneClass}`}>
      <p className="text-2xl font-bold tabular-nums leading-tight">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  )
}

function SectionHeader({ title, search, onSearch, showSearch }: { title: string; search: string; onSearch: (v: string) => void; showSearch: boolean }) {
  return (
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{title}</p>
      {showSearch && <SearchInput value={search} onChange={onSearch} placeholder="ค้นหา" wrapperClassName="w-36" size="sm" />}
    </div>
  )
}

export function MemberDetailModal({ memberId, onClose }: { memberId: string | null; onClose: () => void }) {
  const { teams, members, tasks } = useAppData()
  const navigate = useNavigate()
  const [activeSearch, setActiveSearch] = useState('')
  const [doneSearch, setDoneSearch] = useState('')

  useEffect(() => {
    if (!memberId) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [memberId, onClose])

  const member = useMemo(() => members.find((m) => m.id === memberId) ?? null, [members, memberId])
  const team = useMemo(() => teams.find((t) => t.id === member?.team_id) ?? null, [teams, member])
  const memberTasks = useMemo(() => tasks.filter((t) => t.owner_id === memberId), [tasks, memberId])
  const workload = useMemo(
    () => computeMemberWorkloads(members, tasks).find((w) => w.member.id === memberId),
    [members, tasks, memberId],
  )

  const doing = memberTasks.filter((t) => t.status === 'doing').length
  const waiting = memberTasks.filter((t) => t.status === 'todo' || t.status === 'blocked').length
  const done = memberTasks.filter((t) => t.status === 'done').length
  const donePercent = memberTasks.length > 0 ? Math.round((done / memberTasks.length) * 100) : 0

  const allActive = useMemo(() => memberTasks.filter((t) => t.status !== 'done'), [memberTasks])
  const allDone = useMemo(() => memberTasks.filter((t) => t.status === 'done'), [memberTasks])

  const activeTasks = useMemo(() => {
    const q = activeSearch.trim().toLowerCase()
    return q ? allActive.filter((t) => t.title.toLowerCase().includes(q)) : allActive
  }, [allActive, activeSearch])

  const completedTasks = useMemo(() => {
    const q = doneSearch.trim().toLowerCase()
    return q ? allDone.filter((t) => t.title.toLowerCase().includes(q)) : allDone
  }, [allDone, doneSearch])

  if (!member) return null

  const style = getTeamBadgeStyle(member.id)
  const teamStyle = team ? getTeamBadgeStyle(team.id) : null

  const goToTeam = () => {
    if (!team) return
    onClose()
    navigate(`/admin/teams/${team.id}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-[2px] motion-safe:animate-[modal-overlay-in_.15s_ease-out]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[88vh] w-full max-w-lg overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-black/5 motion-safe:animate-[modal-pop-in_.18s_cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={member.name}
      >
        <div className="max-h-[88vh] overflow-y-auto">
          <div className="flex items-center gap-3 border-b border-border-100 px-6 py-5">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white shadow-md ring-2 ring-white ${style.solid}`}
            >
              {member.name.trim().slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base font-semibold text-ink-900">{member.name}</h2>
              <p className="truncate text-xs text-ink-400">
                เข้าร่วมเมื่อ {formatDate(member.created_at)} · {member.email ?? 'ยังไม่ระบุอีเมล'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-ink-400 transition-colors hover:bg-surface-100 hover:text-ink-600"
              aria-label="ปิด"
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div className="flex flex-wrap items-center gap-2">
              {workload && <WorkloadBadge level={workload.level} />}
              {workload && <span className="text-xs text-ink-400">Load {workload.loadScore}%</span>}
              {team && teamStyle ? (
                <button
                  type="button"
                  onClick={goToTeam}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-80 ${teamStyle.bg} ${teamStyle.text}`}
                >
                  {team.name}
                  <ChevronRight size={12} />
                </button>
              ) : (
                <span className="rounded-full bg-surface-100 px-2.5 py-1 text-xs font-medium text-ink-400">ยังไม่มีทีม</span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <StatTile value={doing} label="กำลังทำ" toneClass="bg-warning-50 text-warning-700" />
              <StatTile value={waiting} label="รอดำเนินการ" toneClass="bg-surface-100 text-ink-600" />
              <StatTile value={done} label="เสร็จแล้ว" toneClass="bg-success-50 text-success-700" />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs text-ink-500">
                <span>ความคืบหน้าการทำงาน</span>
                <span className="font-bold tabular-nums text-primary-600">{donePercent}%</span>
              </div>
              <ProgressBar value={donePercent} size="md" tone="success" />
              <div className="mt-1.5 flex justify-between text-xs text-ink-400">
                <span>
                  เสร็จสิ้น <span className="font-semibold text-ink-600">{done}</span>
                </span>
                <span>
                  งานทั้งหมด <span className="font-semibold text-ink-600">{memberTasks.length}</span>
                </span>
              </div>
            </div>

            <div>
              <SectionHeader
                title={`งานที่กำลังทำ (${allActive.length})`}
                search={activeSearch}
                onSearch={setActiveSearch}
                showSearch={allActive.length > SEARCH_THRESHOLD}
              />
              {activeTasks.length === 0 ? (
                <p className="rounded-xl bg-surface-50 py-4 text-center text-xs text-ink-400">
                  {activeSearch ? 'ไม่พบงานที่ตรงกับการค้นหา' : 'ไม่มีงานที่กำลังดำเนินการ'}
                </p>
              ) : (
                <div className="divide-y divide-border-100 border-t border-border-100">
                  {activeTasks.map((t) => (
                    <div key={t.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
                      <span className="min-w-[8rem] flex-1 truncate font-medium text-ink-800">{t.title}</span>
                      <StatusBadge status={t.status} />
                      <DueDateChip task={t} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <SectionHeader
                title={`ผลงานที่เสร็จแล้ว (${allDone.length})`}
                search={doneSearch}
                onSearch={setDoneSearch}
                showSearch={allDone.length > SEARCH_THRESHOLD}
              />
              {completedTasks.length === 0 ? (
                <p className="rounded-xl bg-surface-50 py-4 text-center text-xs text-ink-400">
                  {doneSearch ? 'ไม่พบผลงานที่ตรงกับการค้นหา' : 'ยังไม่มีผลงาน'}
                </p>
              ) : (
                <ul className="space-y-1.5 text-sm text-ink-600">
                  {completedTasks.map((t) => (
                    <li key={t.id} className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="shrink-0 text-success-600" />
                      <span className="truncate">{t.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
