import type { ComponentType } from 'react'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { Modal } from './Modal'
import { cancelBtnClass, primaryBtnClass } from './formStyles'
import { getTeamBadgeStyle } from '../../lib/teamColor'
import type { Team } from '../../types'

interface AdminNavigateDialogProps {
  open: boolean
  /** The page the user is leaving — shown as the left pill of the "from → Admin" hint. */
  from: { label: string; icon: ComponentType<{ size?: number }> }
  /** Set when the destination is one specific team's Admin page; omit for the general Admin page. */
  team?: Team | null
  onClose: () => void
  onConfirm: () => void
}

/** The single "are you sure you want to go to Admin?" confirmation, shared so every entry point looks identical. */
export function AdminNavigateDialog({ open, from, team, onClose, onConfirm }: AdminNavigateDialogProps) {
  const FromIcon = from.icon
  const style = team ? getTeamBadgeStyle(team.id) : null

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ยืนยันไปหน้า Admin"
      description={`คุณกำลังจะออกจากหน้า ${from.label}`}
      icon={ShieldCheck}
      iconWrapperClassName="flex h-11 w-11 shrink-0 items-center justify-center rounded-full shadow-md ring-2"
      iconClassName="bg-white text-primary-600 ring-primary-500/30"
      iconSize={20}
      widthClassName="max-w-sm"
      footer={
        <>
          <button type="button" onClick={onClose} className={cancelBtnClass}>
            ยกเลิก
          </button>
          <button type="button" onClick={onConfirm} className={`${primaryBtnClass} inline-flex items-center gap-1.5`}>
            ไปที่ Admin
            <ArrowRight size={15} />
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-50 px-3 py-1.5 text-xs font-medium text-ink-600">
            <FromIcon size={14} />
            {from.label}
          </span>
          <ArrowRight size={16} className="text-ink-300" />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-700">
            <ShieldCheck size={14} />
            Admin
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border-100 bg-surface shadow-sm">
          <div className={`h-12 bg-gradient-to-r ${style ? `${style.from} ${style.to}` : 'from-primary-600 to-primary-400'}`} />
          <div className="-mt-6 flex flex-col items-center px-4 pb-4 text-center">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full bg-white text-lg font-bold shadow-md ring-4 ring-white ${style ? style.text : 'text-primary-600'}`}
            >
              {team ? team.name.trim().slice(0, 1).toUpperCase() : <ShieldCheck size={22} />}
            </span>
            <div className="mt-2 flex max-w-full flex-wrap items-center justify-center gap-1.5">
              <p className="truncate text-base font-semibold text-ink-900">{team ? team.name : 'หน้าจัดการ (Admin)'}</p>
              {team?.category && style && (
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${style.bg} ${style.text}`}>{team.category}</span>
              )}
            </div>
            <p className="mt-1 text-xs text-ink-400">
              {team ? 'จะเปิดหน้าจัดการทีมนี้ใน Admin' : 'จัดการทีม สมาชิก และดูสรุปข้อมูลทั้งหมดของระบบ'}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
