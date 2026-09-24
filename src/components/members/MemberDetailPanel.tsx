import { ArrowRightLeft, CheckCircle2, Mail, Pencil, Trash2 } from 'lucide-react'
import { ActionMenu } from '../ui/ActionMenu'
import { DueDateChip, StatusBadge, WorkloadBadge } from '../ui/Badge'
import { EmptyState } from '../ui/EmptyState'
import { getTeamBadgeStyle } from '../../lib/teamColor'
import type { Member, MemberWorkload, Task } from '../../types'

const MAX_DONE_SHOWN = 5

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface MemberDetailPanelProps {
  member: Member
  workload?: MemberWorkload
  tasks: Task[]
  onEdit: () => void
  onDelete: () => void
}

export function MemberDetailPanel({ member, workload, tasks, onEdit, onDelete }: MemberDetailPanelProps) {
  const style = getTeamBadgeStyle(member.id)
  const activeTasks = tasks.filter((t) => t.status !== 'done')
  const doneTasks = tasks.filter((t) => t.status === 'done')
  const overdue = workload?.overdueCount ?? 0

  return (
    <div className="space-y-5 rounded-2xl border border-border p-5">
      <div className="flex items-start gap-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white shadow-md ring-2 ring-white ${style.solid}`}
        >
          {member.name.trim().slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-semibold text-ink-900">{member.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 truncate text-xs text-ink-400">
            <Mail size={12} className="shrink-0" />
            {member.email ?? 'ยังไม่ระบุอีเมล'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {workload && <WorkloadBadge level={workload.level} />}
            {workload && <span className="text-xs text-ink-400">Load {workload.loadScore}%</span>}
            <span className="text-xs text-ink-300">· เข้าร่วมเมื่อ {formatDate(member.created_at)}</span>
          </div>
        </div>
        <ActionMenu
          trigger="icon"
          items={[
            { label: 'แก้ไขข้อมูล', icon: Pencil, onClick: onEdit },
            { label: 'ย้ายไปทีมอื่น', icon: ArrowRightLeft, onClick: onEdit },
            { label: 'ลบออกจากทีม', icon: Trash2, onClick: onDelete, danger: true },
          ]}
        />
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-xl bg-surface-100 px-3 py-3">
          <p className="text-2xl font-bold tabular-nums text-ink-900">{workload?.openTaskCount ?? activeTasks.length}</p>
          <p className="text-xs text-ink-400">งานคงเหลือ</p>
        </div>
        <div className={`rounded-xl px-3 py-3 ${overdue > 0 ? 'bg-danger-50' : 'bg-surface-100'}`}>
          <p className={`text-2xl font-bold tabular-nums ${overdue > 0 ? 'text-danger-600' : 'text-ink-900'}`}>{overdue}</p>
          <p className={`text-xs ${overdue > 0 ? 'text-danger-600/80' : 'text-ink-400'}`}>เกินกำหนด</p>
        </div>
        <div className="rounded-xl bg-surface-100 px-3 py-3">
          <p className="text-2xl font-bold tabular-nums text-ink-900">{workload?.loadScore ?? 0}%</p>
          <p className="text-xs text-ink-400">Load Score</p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">งานที่กำลังทำ ({activeTasks.length})</p>
        {activeTasks.length === 0 ? (
          <EmptyState py="sm">ไม่มีงานที่กำลังดำเนินการ</EmptyState>
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

      {doneTasks.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">ผลงานที่เสร็จแล้ว ({doneTasks.length})</p>
          <ul className="space-y-1.5 text-sm text-ink-600">
            {doneTasks.slice(0, MAX_DONE_SHOWN).map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <CheckCircle2 size={14} className="shrink-0 text-success-600" />
                <span className="truncate">{t.title}</span>
              </li>
            ))}
            {doneTasks.length > MAX_DONE_SHOWN && (
              <li className="pl-6 text-xs text-ink-400">และอีก {doneTasks.length - MAX_DONE_SHOWN} งาน</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
