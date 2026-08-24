export const inputClass =
  'w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm text-ink-700 placeholder:text-ink-400 outline-none transition-colors focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10'
export const fieldLabelClass = 'mb-1.5 block text-xs font-medium text-ink-600'
export const cancelBtnClass =
  'rounded-2xl border border-border bg-surface px-3 py-1.5 text-sm font-medium text-ink-600 transition-colors hover:bg-surface-100'
export const primaryBtnClass =
  'rounded-2xl bg-primary-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm shadow-primary-600/20 transition-colors hover:bg-primary-700 disabled:opacity-50 disabled:shadow-none'

export const selectClass =
  'rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100'

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="mb-3 text-sm text-danger-600">{message}</p>
}
