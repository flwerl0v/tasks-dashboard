import { AlertTriangle } from 'lucide-react'
import { Modal } from './Modal'
import { cancelBtnClass } from './formStyles'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

const dangerBtnClass =
  'rounded-2xl bg-danger-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm shadow-danger-600/20 transition-colors hover:bg-danger-700 disabled:opacity-50 disabled:shadow-none'
const primaryConfirmBtnClass =
  'rounded-2xl bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm shadow-primary-600/20 transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:shadow-none'

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'ยืนยัน',
  cancelLabel = 'ยกเลิก',
  tone = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      icon={AlertTriangle}
      widthClassName="max-w-sm"
      footer={
        <>
          <button type="button" onClick={onCancel} className={cancelBtnClass} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={tone === 'danger' ? dangerBtnClass : primaryConfirmBtnClass}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      {description && <p className="text-sm text-ink-500">{description}</p>}
    </Modal>
  )
}
