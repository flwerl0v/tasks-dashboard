const LEADING_VOWELS = 'เแโใไ'

/**
 * One-letter avatar text for a name. Thai names often start with a leading vowel (เ แ โ ใ ไ), which makes a useless
 * one-letter avatar, so use the first real letter after it. Combining marks (tone marks, upper/lower vowels) are never
 * used on their own — they render as a stray dot or accent in the avatar.
 */
export function nameInitial(name: string): string {
  const chars = [...name.trim()]
  const isLetter = (c: string) => /\p{L}/u.test(c)
  const pick = chars.find((c) => isLetter(c) && !LEADING_VOWELS.includes(c)) ?? chars.find(isLetter) ?? chars[0] ?? ''
  return pick.toUpperCase()
}
