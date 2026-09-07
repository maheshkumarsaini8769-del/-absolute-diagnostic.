/**
 * Walk-in patient password system.
 * Password = first 4 letters of patient name (uppercase) + age
 * Example: MAHESH, 18 -> MAHE18
 */

export function generateWalkInPassword(name: string, age: number): string {
  const normalized = name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')

  const letters = normalized.replace(/[^A-Z\u0900-\u097F]/g, '').slice(0, 4)

  if (letters.length === 0) {
    return `XXXX${age}`
  }

  return `${letters}${age}`
}

export function verifyWalkInPassword(
  name: string,
  age: number,
  enteredPassword: string
): boolean {
  const expected = generateWalkInPassword(name, age)
  return expected === enteredPassword.trim().toUpperCase()
}

/**
 * Normalize patient name for matching.
 * - Trim whitespace
 * - Uppercase
 * - Collapse multiple spaces
 */
export function normalizeName(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ')
}

/**
 * Check if two names are a potential match.
 * Uses normalized exact match.
 */
export function namesMatch(a: string, b: string): boolean {
  return normalizeName(a) === normalizeName(b)
}
