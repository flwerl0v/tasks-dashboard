import { useId } from 'react'

/** Google Gemini's four-point sparkle mark, used to badge content generated via the Gemini API. */
export function GeminiIcon({ size = 18, className = '' }: { size?: number; className?: string }) {
  const gradientId = useId()
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} aria-hidden="true">
      <path
        d="M12 0C12 6.6274 17.3726 12 24 12C17.3726 12 12 17.3726 12 24C12 17.3726 6.6274 12 0 12C6.6274 12 12 6.6274 12 0Z"
        fill={`url(#${gradientId})`}
      />
      <defs>
        <linearGradient id={gradientId} x1="0" y1="12" x2="24" y2="12" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4893FC" />
          <stop offset="0.27" stopColor="#4893FC" />
          <stop offset="0.777" stopColor="#969DFF" />
          <stop offset="1" stopColor="#BD99FE" />
        </linearGradient>
      </defs>
    </svg>
  )
}
