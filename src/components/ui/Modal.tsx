import { useEffect, type ComponentType, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: ComponentType<{ size?: number }>
  children: ReactNode
  footer?: ReactNode
  widthClassName?: string
}

export function Modal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  children,
  footer,
  widthClassName = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/50 p-4 backdrop-blur-[2px] motion-safe:animate-[modal-overlay-in_.15s_ease-out]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={`w-full ${widthClassName} overflow-hidden rounded-2xl bg-surface shadow-2xl ring-1 ring-black/5 motion-safe:animate-[modal-pop-in_.18s_cubic-bezier(0.16,1,0.3,1)]`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border-100 px-6 py-5">
          <div className="flex items-start gap-3">
            {Icon && (
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                <Icon size={19} />
              </span>
            )}
            <div>
              <h3 className="text-base font-semibold leading-6 text-ink-900">{title}</h3>
              {description && <p className="mt-0.5 text-xs text-ink-400">{description}</p>}
            </div>
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
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-border-100 bg-surface-50/70 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>
  )
}
