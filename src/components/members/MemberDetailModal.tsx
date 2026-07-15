import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Clock, ChevronRight, Inbox, Search, Users, X } from 'lucide-react'
import { useAppData } from '../../context/AppDataContext'
import { StatusBadge, PriorityBadge } from '../ui/Badge'
import { getTeamBadgeStyle } from '../../lib/teamColor'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
}

function StatTile({
  icon: Icon,
  value,
  label,
  toneClass,
}: {
  icon: typeof Clock
  value: number
  label: string
  toneClass: string
}) {
  return (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${toneClass}`}>
      <div>
        <p className="text-2xl font-bold tabular-nums">{String(value).padStart(2, '0')}</p>
        <p className="text-xs opacity-80">{label}</p>
      </div>
      <Icon size={20} className="opacity-70" />
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
  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams])

  const doing = memberTasks.filter((t) => t.status === 'doing').length
  const waiting = memberTasks.filter((t) => t.status === 'todo' || t.status === 'blocked').length
  const done = memberTasks.filter((t) => t.status === 'done').length
  const donePercent = memberTasks.length > 0 ? Math.round((done / memberTasks.length) * 100) : 0

  const activeTasks = useMemo(() => {
    const q = activeSearch.trim().toLowerCase()
    const list = memberTasks.filter((t) => t.status !== 'done')
    return q ? list.filter((t) => t.title.toLowerCase().includes(q)) : list
  }, [memberTasks, activeSearch])

  const completedTasks = useMemo(() => {
    const q = doneSearch.trim().toLowerCase()
    const list = memberTasks.filter((t) => t.status === 'done')
    return q ? list.filter((t) => t.title.toLowerCase().includes(q)) : list
  }, [memberTasks, doneSearch])

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-[2px] motion-safe:animate-[modal-overlay-in_.15s_ease-out]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[88vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 motion-safe:animate-[modal-pop-in_.18s_cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={member.name}
      >
        <div className="max-h-[88vh] overflow-y-auto">
          <div className={`relative bg-gradient-to-r ${style.from} ${style.to} px-6 py-6 text-white`}>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              aria-label="ปิด"
            >
              <X size={18} />
            </button>
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border-2 border-white/40 bg-white/15 text-xl font-bold">
                {member.name.trim().slice(0, 1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold">{member.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium">สมาชิก</span>
                  {member.email && <span className="truncate text-xs text-white/80">{member.email}</span>}
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-white/75">เข้าร่วมเมื่อ {formatDate(member.created_at)}</p>
          </div>

          <div className="space-y-5 px-6 py-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[200px_1fr]">
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-800">ภาพรวมกิจกรรม</p>
                <div className="flex flex-col gap-2.5">
                  <StatTile icon={Clock} value={doing} label="กำลังดำเนินการ" toneClass="border-amber-100 bg-amber-50 text-amber-700" />
                  <StatTile icon={Inbox} value={waiting} label="รอดำเนินการ" toneClass="border-slate-200 bg-slate-50 text-slate-600" />
                  <StatTile icon={CheckCircle2} value={done} label="เสร็จสมบูรณ์" toneClass="border-emerald-100 bg-emerald-50 text-emerald-700" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-800">ทีม</p>
                  {team ? (
                    <button
                      type="button"
                      onClick={goToTeam}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${teamStyle?.solid}`}>
                          <Users size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-medium text-slate-800">{team.name}</p>
                          <p className="text-xs text-slate-400">{members.filter((m) => m.team_id === team.id).length} สมาชิก</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-slate-400" />
                    </button>
                  ) : (
                    <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-400">ยังไม่มีทีม</p>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">ความคืบหน้าการทำงาน</p>
                    <span className="text-sm font-bold tabular-nums text-blue-600">{donePercent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${donePercent}%` }} />
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-slate-400">
                    <span>
                      เสร็จสิ้น <span className="font-semibold text-slate-600">{done}</span>
                    </span>
                    <span>
                      งานทั้งหมด <span className="font-semibold text-slate-600">{memberTasks.length}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">งานที่กำลังทำ ({activeTasks.length})</p>
                <div className="relative w-40">
                  <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={activeSearch}
                    onChange={(e) => setActiveSearch(e.target.value)}
                    placeholder="ค้นหางาน..."
                    className="w-full rounded-lg border border-slate-200 py-1.5 pl-7 pr-2 text-xs outline-none focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                {activeTasks.map((t) => (
                  <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-700">{t.title}</p>
                      <p className="text-xs text-slate-400">{teamById.get(t.team_id ?? '')?.name ?? 'ไม่มีทีม'}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                    </div>
                  </div>
                ))}
                {activeTasks.length === 0 && (
                  <p className="rounded-lg border border-slate-100 bg-slate-50 py-4 text-center text-xs text-slate-400">
                    ไม่มีงานที่กำลังดำเนินการ
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">ผลงาน ({completedTasks.length})</p>
                <div className="relative w-40">
                  <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={doneSearch}
                    onChange={(e) => setDoneSearch(e.target.value)}
                    placeholder="ค้นหาผลงาน..."
                    className="w-full rounded-lg border border-slate-200 py-1.5 pl-7 pr-2 text-xs outline-none focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                {completedTasks.map((t) => (
                  <div key={t.id} className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                    <span className="mb-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      งานทีม
                    </span>
                    <p className="text-sm font-medium text-slate-700">{t.title}</p>
                    <p className="text-xs text-slate-400">{teamById.get(t.team_id ?? '')?.name ?? 'ไม่มีทีม'}</p>
                  </div>
                ))}
                {completedTasks.length === 0 && (
                  <p className="rounded-lg border border-slate-100 bg-slate-50 py-4 text-center text-xs text-slate-400">ยังไม่มีผลงาน</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
