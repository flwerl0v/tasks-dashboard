import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, X } from 'lucide-react'

interface ToastItem {
  id: number
  message: string
}

interface ToastContextValue {
  showError: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components -- provider + its hook are colocated by convention
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

let nextToastId = 1
const AUTO_DISMISS_MS = 8000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showError = useCallback(
    (message: string) => {
      const id = nextToastId++
      setToasts((prev) => [...prev, { id, message }])
      setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    },
    [dismiss],
  )

  useEffect(() => {
    // Last-resort net — catches bugs no local try/catch handled, so they surface
    // as a visible popup instead of only ever showing up in the DevTools console.
    const onWindowError = (event: ErrorEvent) => {
      showError(event.message || 'เกิดข้อผิดพลาดที่ไม่คาดคิด')
    }
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message =
        reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
      showError(message)
    }
    window.addEventListener('error', onWindowError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)
    return () => {
      window.removeEventListener('error', onWindowError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [showError])

  return (
    <ToastContext.Provider value={{ showError }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-2 rounded-xl border border-danger-200 bg-surface px-4 py-3 text-sm text-danger-700 shadow-lg motion-safe:animate-[modal-pop-in_.18s_cubic-bezier(0.16,1,0.3,1)]"
            role="alert"
          >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <p className="flex-1 break-words">{t.message}</p>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded p-0.5 text-danger-400 transition-colors hover:bg-danger-50 hover:text-danger-600"
              aria-label="ปิด"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
