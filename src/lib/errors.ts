/**
 * Extracts a human-readable message from a caught value.
 *
 * `err instanceof Error` alone isn't enough here: Supabase surfaces network-level
 * failures (DNS, offline, CORS) as plain `{ message, details, hint, code }` objects
 * rather than `Error` instances, so a naive check falls through to a generic
 * fallback and hides the real reason.
 */
export function toErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'object' && err !== null && 'message' in err) {
    const message = (err as { message: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  if (typeof err === 'string' && err.trim()) return err
  return fallback
}
