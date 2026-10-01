import type { ComponentType } from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Modal } from './Modal'
import { cancelBtnClass, primaryBtnClass } from './formStyles'
import { getTeamBadgeStyle } from '../../lib/teamColor'
import { nameInitial } from '../../lib/nameInitial'
import type { Team } from '../../types'

export interface AdminNavigateStats {
  members: number
  doing: number
  overdue: number
}

export interface NavigateDestination {
  /** Short page name used in the title, the pill and the confirm button, e.g. "Admin". */
  label: string
  icon: ComponentType<{ size?: number }>
  /** Big heading in the card and the one-line description under it. */
  heading: string
  description: string
}

const ADMIN_DESTINATION: NavigateDestination = {
  label: 'Admin',
  icon: ShieldCheck,
  heading: 'หน้าจัดการ (Admin)',
  description: 'จัดการทีม สมาชิก และดูสรุปข้อมูลทั้งหมดของระบบ',
}

interface AdminNavigateDialogProps {
  open: boolean
  /** The page the user is leaving — shown as the left pill of the "from → Admin" hint. */
  from: { label: string; icon: ComponentType<{ size?: number }> }
  /** Where the user is going. Defaults to the Admin page. */
  to?: NavigateDestination
  /** Set when the destination is one specific team's Admin page; omit for the general Admin page. */
  team?: Team | null
  /** Quick numbers for the team, shown as small chips. Omit to hide them. */
  stats?: AdminNavigateStats
  onClose: () => void
  onConfirm: () => void
}

// The number and its label share a text baseline (Thai fonts sit low in their line box, so centering two
// different font sizes made the bigger number look dropped). Only the dot is centered on the pill.
function StatChip({ label, value, dot, alert = false }: { label: string; value: number; dot?: string; alert?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 leading-none ${
        alert ? 'border-danger-100 bg-danger-50 text-danger-700' : 'border-border bg-surface text-ink-600'
      }`}
    >
      {dot && <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} />}
      <span className="relative -top-px inline-flex items-baseline gap-1.5">
        <b className={`text-[15px] tabular-nums ${alert ? '' : 'text-ink-900'}`}>{value}</b>
        <span className="text-[13px]">{label}</span>
      </span>
    </span>
  )
}

/** The single "are you sure you want to go to Admin?" confirmation, shared so every entry point looks identical. */
export function AdminNavigateDialog({ open, from, to = ADMIN_DESTINATION, team, stats, onClose, onConfirm }: AdminNavigateDialogProps) {
  const FromIcon = from.icon
  const ToIcon = to.icon
  const style = team ? getTeamBadgeStyle(team.id) : null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`ยืนยันไปหน้า ${to.label}`}
      description={`คุณกำลังจะออกจากหน้า ${from.label}`}
      icon={ToIcon}
      iconClassName="bg-surface-100 text-ink-700 ring-transparent"
      widthClassName="max-w-md"
      footer={
        <>
          <button type="button" onClick={onClose} className={cancelBtnClass}>
            ยกเลิก
          </button>
          <button type="button" onClick={onConfirm} className={`${primaryBtnClass} inline-flex items-center gap-1.5`}>
            ไปที่ {to.label}
            <ArrowRight size={15} />
          </button>
        </>
      }
    >
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className={`flex justify-center bg-gradient-to-br px-5 pb-12 pt-4 ${style ? `${style.from} ${style.to}` : 'from-ink-700 to-ink-900'}`}>
          <span className="inline-flex items-center gap-2 text-[13px] text-white/85">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 font-medium text-white">
              <FromIcon size={13} />
              {from.label}
            </span>
            <ArrowRight size={14} />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-bold text-ink-900">
              <ToIcon size={13} />
              {to.label}
            </span>
          </span>
        </div>

        <div className="flex flex-col items-center px-5 pb-5 text-center">
          <span className="-mt-10 flex h-[76px] w-[76px] items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/5">
            <span
              className={`flex h-16 w-16 items-center justify-center rounded-full text-[26px] font-extrabold text-white ${style ? style.solid : 'bg-ink-900'}`}
            >
              {team ? nameInitial(team.name) : <ToIcon size={26} />}
            </span>
          </span>

          <div className="mt-3 flex max-w-full flex-wrap items-center justify-center gap-2">
            <p className="truncate text-[22px] font-extrabold text-ink-900">{team ? team.name : to.heading}</p>
            {team?.category && (
              <span className="rounded-full border border-border bg-white px-2.5 py-0.5 text-xs font-medium text-ink-600">{team.category}</span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-ink-500">
            {team ? 'จะเปิดหน้าจัดการทีมนี้ใน Admin' : to.description}
          </p>

          {team && stats && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <StatChip label="สมาชิก" value={stats.members} />
              <StatChip label="กำลังทำ" value={stats.doing} dot="bg-warning-500" />
              <StatChip label="เกินกำหนด" value={stats.overdue} dot={stats.overdue > 0 ? 'bg-danger-500' : 'bg-ink-300'} alert={stats.overdue > 0} />
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
