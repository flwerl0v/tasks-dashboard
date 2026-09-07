/** Formats an ISO date string as d/m/yyyy, or "-" when absent. */
export function formatDueDate(dueDate: string | null): string {
  if (!dueDate) return '-'
  const date = new Date(dueDate)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${day}/${month}/${date.getFullYear()}`
}
