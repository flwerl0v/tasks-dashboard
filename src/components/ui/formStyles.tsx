export const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 outline-none transition-colors focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10'
export const fieldLabelClass = 'mb-1.5 block text-xs font-medium text-slate-600'
export const cancelBtnClass =
  'rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100'
export const primaryBtnClass =
  'rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none'

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null
  return <p className="mb-3 text-sm text-rose-600">{message}</p>
}
