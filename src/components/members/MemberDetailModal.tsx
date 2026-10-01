import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertOctagon, CheckCircle2, ChevronRight, Circle, Flag, Lightbulb, ListChecks, PlayCircle, RefreshCw, ShieldAlert, X } from 'lucide-react'
import { useAppData } from '../../context/AppDataContext'
import { WorkloadBadge } from '../ui/Badge'
import { GeminiIcon } from '../ui/GeminiIcon'
import { SearchInput } from '../ui/SearchInput'
import { cancelBtnClass, primaryBtnClass } from '../ui/formStyles'
import { PRIORITY_COLORS } from '../../lib/colors'
import { getTeamBadgeStyle } from '../../lib/teamColor'
import { nameInitial } from '../../lib/nameInitial'
import { isOverdue } from '../../lib/stats'
import { computeMemberWorkloads } from '../../lib/workload'
import { generateMemberInsight } from '../../lib/workloadInsight'
import { WORKLOAD_CONFIG } from '../../lib/workloadConfig'
import type { AiWorkloadInsight, Member, Task, TaskPriority, TaskStatus, WorkloadLevel } from '../../types'

const SEARCH_THRESHOLD = 5

// Reopening the same member within a few minutes reuses the last real AI answer instead of waiting on Gemini again.
const AI_CACHE_TTL_MS = 10 * 60 * 1000
const aiCache = new Map<string, { insight: AiWorkloadInsight; at: number }>()
const DAY_MS = 1000 * 60 * 60 * 24

const STATUS_DOT: Record<TaskStatus, { label: string; dot: string }> = {
  todo: { label: 'ยังไม่เริ่ม', dot: 'bg-ink-300' },
  doing: { label: 'กำลังทำ', dot: 'bg-warning-500' },
  blocked: { label: 'ติดปัญหา', dot: 'bg-danger-500' },
  done: { label: 'สำเร็จ', dot: 'bg-success-500' },
}

const PRIORITY_LABEL: Record<TaskPriority, string> = { low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical' }

const LOAD_TEXT: Record<WorkloadLevel, string> = {
  overload: 'text-danger-700',
  balanced: 'text-ink-900',
  underload: 'text-warning-700',
}

const SUGGEST_STYLE: Record<WorkloadLevel, { box: string; icon: string }> = {
  overload: { box: 'border-danger-100 bg-gradient-to-t from-white to-danger-50', icon: 'bg-danger-100 text-danger-600' },
  underload: { box: 'border-warning-100 bg-gradient-to-t from-white to-warning-50', icon: 'bg-warning-100 text-warning-600' },
  balanced: { box: 'border-border bg-surface-50', icon: 'bg-surface-200 text-ink-500' },
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
}

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

/** 1 -> "1", 1.5 -> "1.5" — whole days shouldn't read like a computed value ("1.0"). */
function formatDays(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

function daysOverdue(task: Task): number {
  const today = new Date(new Date().toDateString())
  return Math.max(0, Math.round((today.getTime() - new Date(task.due_date as string).getTime()) / DAY_MS))
}

function SectionTitle({ children, aside }: { children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between gap-3">
      <h3 className="text-xs font-bold uppercase tracking-wide text-ink-500">{children}</h3>
      {aside}
    </div>
  )
}

type Filter = 'all' | 'overdue' | 'doing' | 'todo' | 'done'

function CountPill({
  label,
  value,
  icon: Icon,
  iconClass,
  alert = false,
  active,
  activeClass,
  onClick,
}: {
  label: string
  value: number
  icon: typeof Circle
  iconClass: string
  alert?: boolean
  active: boolean
  /** Classes for the selected state — the member's own color, so it isn't a heavy black pill. */
  activeClass: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={label === 'รวม' ? 'แสดงทั้งหมด' : active ? 'กดอีกครั้งเพื่อแสดงทั้งหมด' : `แสดงเฉพาะ${label}`}
      className={`inline-flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 leading-none transition-colors ${
        active
          ? `border-transparent ring-1 ring-current ${activeClass}`
          : alert
            ? 'border-danger-100 bg-danger-50 text-danger-700 hover:border-danger-500/50'
            : 'border-border bg-surface text-ink-600 hover:border-ink-400 hover:bg-surface-50'
      }`}
    >
      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${active ? 'bg-white/70 text-current' : iconClass}`}>
        <Icon size={12} />
      </span>
      <span className="relative -top-px inline-flex items-baseline gap-1.5">
        <b className="text-[15px] tabular-nums">{value}</b>
        <span className="text-[13px]">{label}</span>
      </span>
    </button>
  )
}

function TaskRow({ task, accentClass }: { task: Task; accentClass: string }) {
  const status = STATUS_DOT[task.status]
  const late = isOverdue(task)
  return (
    <div className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 border-b border-border-100 px-1 py-3 last:border-0 sm:grid-cols-[20px_minmax(0,1fr)_92px_104px_92px]">
      <span title={PRIORITY_LABEL[task.priority]} style={{ color: PRIORITY_COLORS[task.priority] }}>
        <Flag size={14} className="fill-current" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-ink-900" title={task.title}>
          {task.title}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-500">
          <span className={`h-2 w-2 shrink-0 rounded-full ${status.dot}`} />
          {status.label} · {PRIORITY_LABEL[task.priority]}
        </p>
      </div>
      <span className="hidden whitespace-nowrap rounded bg-surface-100 px-1.5 py-0.5 text-center text-xs tabular-nums text-ink-600 sm:block">
        ใช้เวลา {formatDays(task.effort_days)} วัน
      </span>
      <div className="hidden sm:block">
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-100">
          <div className={`h-full rounded-full ${accentClass}`} style={{ width: `${task.progress}%` }} />
        </div>
        <p className="mt-0.5 text-[11px] tabular-nums text-ink-500">{task.progress}%</p>
      </div>
      <span
        className={`justify-self-end whitespace-nowrap rounded-md px-2 py-0.5 text-xs ${
          late ? 'bg-danger-50 font-semibold text-danger-700' : 'text-ink-500'
        }`}
        title={task.due_date ? formatDate(task.due_date) : undefined}
      >
        {late ? `เกิน ${daysOverdue(task)} วัน` : task.due_date ? formatShortDate(task.due_date) : 'ไม่มีกำหนด'}
      </span>
    </div>
  )
}

/** The insight builder appends "(สาเหตุ: …)" to the fallback note — pull it out so the reason is easy to spot. */
function FailureNote({ note }: { note: string }) {
  const match = note.match(/\(สาเหตุ: (.+)\)$/)
  const reason = match?.[1]
  const rest = match ? note.slice(0, match.index).trim() : note
  return (
    <div className="rounded-md bg-warning-50 px-3 py-2 text-xs leading-relaxed text-warning-700 ring-1 ring-warning-500/20">
      {reason && (
        <p>
          <span className="font-semibold">สาเหตุที่ใช้ AI ไม่ได้:</span> {reason}
        </p>
      )}
      <p className={reason ? 'mt-0.5 text-ink-500' : ''}>{rest}</p>
    </div>
  )
}

interface MemberDetailModalProps {
  memberId: string | null
  onClose: () => void
  /** Optional footer actions — the popup closes itself before calling these so the next dialog isn't stacked on top of it. */
  onEdit?: (member: Member) => void
  onDelete?: (member: Member) => void
}

export function MemberDetailModal({ memberId, onClose, onEdit, onDelete }: MemberDetailModalProps) {
  const { teams, members, tasks } = useAppData()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [aiInsight, setAiInsight] = useState<AiWorkloadInsight | null>(() => {
    const hit = memberId ? aiCache.get(memberId) : undefined
    return hit && Date.now() - hit.at < AI_CACHE_TTL_MS ? hit.insight : null
  })
  const [aiLoading, setAiLoading] = useState(false)

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

  const count = (status: TaskStatus) => memberTasks.filter((t) => t.status === status).length

  const q = search.trim().toLowerCase()
  const visible = useMemo(() => (q ? memberTasks.filter((t) => t.title.toLowerCase().includes(q)) : memberTasks), [memberTasks, q])
  const matchesFilter = (t: Task) => {
    switch (filter) {
      case 'overdue':
        return isOverdue(t)
      case 'doing':
        return t.status === 'doing'
      case 'todo':
        return t.status === 'todo' || t.status === 'blocked'
      case 'done':
        return t.status === 'done'
      default:
        return true
    }
  }
  const openTasks = useMemo(
    () =>
      filter === 'done'
        ? []
        : visible
            .filter((t) => t.status !== 'done' && matchesFilter(t))
            .sort((a, b) => Number(isOverdue(b)) - Number(isOverdue(a)) || (isOverdue(a) && isOverdue(b) ? daysOverdue(b) - daysOverdue(a) : 0)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible, filter],
  )
  const doneTasks = useMemo(
    () => (filter === 'all' || filter === 'done' ? visible.filter((t) => t.status === 'done') : []),
    [visible, filter],
  )
  const toggle = (f: Filter) => setFilter((cur) => (cur === f ? 'all' : f))

  if (!member) return null

  const style = getTeamBadgeStyle(member.id)
  const suggest = workload ? SUGGEST_STYLE[workload.level] : null
  const activeClass = `${style.bg} ${style.text}`

  // AI is opt-in: the rule-based tip above is always shown instantly; this only calls the Edge Function on click
  // (it can hit Gemini quota limits, and falls back to rule-based text with the reason if it fails).
  const runAi = async () => {
    if (!workload) return
    setAiLoading(true)
    const insight = await generateMemberInsight(workload, tasks)
    if (insight.source === 'ai') aiCache.set(workload.member.id, { insight, at: Date.now() })
    setAiInsight(insight)
    setAiLoading(false)
  }

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
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-surface shadow-2xl ring-1 ring-black/5 motion-safe:animate-[modal-pop-in_.18s_cubic-bezier(0.16,1,0.3,1)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={member.name}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-md bg-white/60 p-1.5 text-ink-500 transition-colors hover:bg-white hover:text-ink-900"
          aria-label="ปิด"
        >
          <X size={18} />
        </button>

        <div className="flex-1 overflow-y-auto">
          <header className={`flex flex-wrap items-center gap-4 bg-gradient-to-b ${style.tint} to-white px-7 pb-5 pt-6`}>
            <span
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-extrabold text-white shadow-md ring-4 ring-white/90 ${style.solid}`}
            >
              {nameInitial(member.name)}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[22px] font-extrabold text-ink-900">{member.name}</h2>
              <p className="mt-0.5 truncate text-[13px] text-ink-600">
                เข้าร่วมเมื่อ {formatDate(member.created_at)} · {member.email ?? 'ยังไม่ระบุอีเมล'}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {workload && <WorkloadBadge level={workload.level} />}
                {team ? (
                  <button
                    type="button"
                    onClick={goToTeam}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-0.5 text-xs font-medium text-ink-700 transition-colors hover:bg-surface-100"
                  >
                    {team.name}
                    <ChevronRight size={12} />
                  </button>
                ) : (
                  <span className="rounded-full border border-border bg-white px-2.5 py-0.5 text-xs font-medium text-ink-400">ยังไม่มีทีม</span>
                )}
              </div>
            </div>
            {workload && (
              <div className="mr-8 text-right">
                <p className={`text-[34px] font-extrabold leading-none tabular-nums ${LOAD_TEXT[workload.level]}`}>{workload.loadScore}%</p>
                <p className="mt-1 text-[11.5px] text-ink-500">
                  {workload.weightedRemainingEffort.toFixed(1)} จาก {WORKLOAD_CONFIG.weeklyCapacityDays} วัน/สัปดาห์
                </p>
              </div>
            )}
          </header>

          <div className="flex flex-wrap gap-2 px-7">
            <CountPill
              label="รวม"
              value={memberTasks.length}
              icon={ListChecks}
              iconClass="bg-surface-100 text-ink-500"
              active={filter === 'all'}
              activeClass={activeClass}
              onClick={() => setFilter('all')}
            />
            <CountPill
              active={filter === 'overdue'}
              activeClass={activeClass}
              onClick={() => toggle('overdue')}
              label="เกินกำหนด"
              value={workload?.overdueCount ?? 0}
              icon={AlertOctagon}
              iconClass={(workload?.overdueCount ?? 0) > 0 ? 'bg-danger-100 text-danger-600' : 'bg-surface-100 text-ink-400'}
              alert={(workload?.overdueCount ?? 0) > 0}
            />
            <CountPill label="กำลังทำ" value={count('doing')} icon={PlayCircle} iconClass="bg-warning-50 text-warning-700" active={filter === 'doing'} activeClass={activeClass} onClick={() => toggle('doing')} />
            <CountPill label="ยังไม่เริ่ม" value={count('todo') + count('blocked')} icon={Circle} iconClass="bg-surface-100 text-ink-500" active={filter === 'todo'} activeClass={activeClass} onClick={() => toggle('todo')} />
            <CountPill label="เสร็จแล้ว" value={count('done')} icon={CheckCircle2} iconClass="bg-success-50 text-success-700" active={filter === 'done'} activeClass={activeClass} onClick={() => toggle('done')} />
          </div>

          {workload && suggest && (
            <div className="space-y-3 px-7 pt-4">
              <div className={`rounded-lg border px-4 py-3 text-[13px] leading-relaxed text-ink-700 ${suggest.box}`}>
                <div className="flex gap-3">
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${suggest.icon}`}>
                    <Lightbulb size={15} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink-900">คำแนะนำจากระบบ</p>
                    <p>{workload.suggestedAction}</p>
                  </div>
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => void runAi()}
                    disabled={aiLoading}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-white px-2.5 py-1 text-xs font-medium text-ink-700 transition-colors hover:bg-surface-100 disabled:opacity-60"
                  >
                    {aiInsight ? <RefreshCw size={12} className={aiLoading ? 'animate-spin' : ''} /> : <GeminiIcon size={13} />}
                    {aiLoading ? 'กำลังวิเคราะห์...' : aiInsight ? 'ขอสรุปใหม่' : 'ให้ AI ช่วยวิเคราะห์'}
                  </button>
                </div>
              </div>

              {(aiLoading || aiInsight) && (
                <div
                  className={`rounded-lg border bg-gradient-to-br p-4 ${
                    aiInsight?.source === 'fallback'
                      ? 'border-warning-500/25 from-warning-50 via-surface to-surface'
                      : 'border-accent-600/15 from-accent-50 via-surface to-surface'
                  }`}
                >
                  {aiLoading || !aiInsight ? (
                    <p className="flex items-center gap-2 text-sm text-ink-500">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-600" />
                      กำลังให้ AI วิเคราะห์... <span className="text-xs text-ink-400">(ปกติไม่เกิน 15 วินาที)</span>
                    </p>
                  ) : (
                    <div className="space-y-2.5 text-[13px] leading-relaxed">
                      {(
                        [
                          ['สรุป', aiInsight.summary],
                          ['เหตุผล', aiInsight.risk_reason],
                          ['คำแนะนำ', aiInsight.suggested_action],
                        ] as const
                      ).map(([label, text]) => (
                        <div key={label}>
                          <p className="text-[11px] font-bold uppercase tracking-wide text-ink-500">{label}</p>
                          <p className="text-ink-700">{text}</p>
                        </div>
                      ))}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            aiInsight.source === 'fallback' ? 'bg-warning-100 text-warning-700' : 'bg-primary-100 text-primary-700'
                          }`}
                        >
                          {aiInsight.source === 'fallback' ? <ShieldAlert size={12} /> : <GeminiIcon size={12} />}
                          {aiInsight.source === 'fallback' ? 'AI ใช้ไม่ได้ — แสดงแบบคำนวณจากกฎ' : 'Gemini AI'}
                        </span>
                        {aiInsight.source === 'ai' && <span className="text-xs text-ink-500">{aiInsight.confidence_note}</span>}
                      </div>
                      {aiInsight.source === 'fallback' && <FailureNote note={aiInsight.confidence_note} />}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {filter !== 'done' && (
          <section className="px-7 pb-2 pt-5">
            <SectionTitle
              aside={
                memberTasks.length > SEARCH_THRESHOLD ? (
                  <SearchInput value={search} onChange={setSearch} placeholder="ค้นหา" wrapperClassName="w-40" size="sm" />
                ) : undefined
              }
            >
              งานที่ค้าง · {openTasks.length}
            </SectionTitle>
            {openTasks.length === 0 ? (
              <p className="py-3 text-sm text-ink-400">{q ? 'ไม่พบงานที่ตรงกับการค้นหา' : filter === 'all' ? 'ไม่มีงานค้าง' : 'ไม่มีงานในหมวดนี้'}</p>
            ) : (
              <div className="border-t border-border-100">
                {openTasks.map((t) => (
                  <TaskRow key={t.id} task={t} accentClass={style.solid} />
                ))}
              </div>
            )}
          </section>
          )}

          {(filter === 'all' || filter === 'done') && (
          <section className="px-7 pb-6 pt-3">
            <SectionTitle>เสร็จแล้ว · {doneTasks.length}</SectionTitle>
            {doneTasks.length === 0 ? (
              <p className="text-sm text-ink-400">{q ? 'ไม่พบผลงานที่ตรงกับการค้นหา' : 'ยังไม่มีผลงาน'}</p>
            ) : (
              <ul className="space-y-1.5">
                {doneTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2.5 rounded-lg bg-success-50 px-3 py-2 text-sm text-ink-600">
                    <CheckCircle2 size={14} className="shrink-0 text-success-600" />
                    <span className="truncate">{t.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          )}
        </div>

        <footer className="flex items-center gap-2 border-t border-border bg-surface-50 px-7 py-3.5">
          {team && (
            <button type="button" onClick={goToTeam} className={primaryBtnClass}>
              ดูงานทั้งหมดของทีม
            </button>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onEdit(member)
              }}
              className={cancelBtnClass}
            >
              แก้ไข
            </button>
          )}
          <span className="flex-1" />
          {onDelete && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onDelete(member)
              }}
              className={`${cancelBtnClass} text-danger-700 hover:bg-danger-50`}
            >
              ลบ
            </button>
          )}
        </footer>
      </div>
    </div>
  )
}
