/**
 * Robust clinical date parser for diagnostic lab reports.
 * Supports multiple Indian and International formats:
 * - DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
 * - YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
 * - DD Month YYYY (e.g., 26 Aug 2026, 26-August-2026)
 * - Optional time components: HH:mm, HH:mm:ss, 12-hour AM/PM
 * Never returns or saves "Invalid Date".
 */

const MONTH_NAMES: Record<string, number> = {
  jan: 1, january: 1,
  feb: 2, february: 2,
  mar: 3, march: 3,
  apr: 4, april: 4,
  may: 5,
  jun: 6, june: 6,
  jul: 7, july: 7,
  aug: 8, august: 8,
  sep: 9, september: 9, sept: 9,
  oct: 10, october: 10,
  nov: 11, november: 11,
  dec: 12, december: 12,
}

export function parseReportDate(input: unknown): Date | null {
  if (!input) return null

  // If already a valid Date object
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? null : input
  }

  // If timestamp number
  if (typeof input === 'number') {
    const d = new Date(input)
    return isNaN(d.getTime()) ? null : d
  }

  if (typeof input !== 'string') return null

  const str = input.trim()
  if (!str) return null

  // 1. Check for standard ISO format (e.g. 2026-08-26T18:58:57Z or 2026-08-26)
  if (/^\d{4}-\d{2}-\d{2}(?:T|\s).*/i.test(str)) {
    const parsed = new Date(str)
    if (!isNaN(parsed.getTime())) return parsed
  }

  // Extract date and optional time components
  // Match e.g. "26/08/2026 18:30:00" or "26-08-2026 06:30 PM" or "26.08.2026"
  const timeMatch = str.match(/(?:at\s+)?(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i)
  let hours = 0
  let minutes = 0
  let seconds = 0

  if (timeMatch) {
    hours = parseInt(timeMatch[1], 10)
    minutes = parseInt(timeMatch[2], 10)
    seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0
    const meridian = timeMatch[4]?.toLowerCase()
    if (meridian === 'pm' && hours < 12) hours += 12
    if (meridian === 'am' && hours === 12) hours = 0
  }

  // Strip time part for pure date matching
  const dateStr = str.replace(/(?:at\s+)?\d{1,2}:\d{2}(?::\d{2})?\s*(?:am|pm)?/i, '').trim()

  // 2. Format: DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const dmyMatch = dateStr.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/)
  if (dmyMatch) {
    const day = parseInt(dmyMatch[1], 10)
    const month = parseInt(dmyMatch[2], 10)
    let year = parseInt(dmyMatch[3], 10)
    if (year < 100) year += 2000

    if (isValidDateParts(year, month, day)) {
      const d = new Date(year, month - 1, day, hours, minutes, seconds)
      if (!isNaN(d.getTime())) return d
    }
  }

  // 3. Format: YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = dateStr.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/)
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10)
    const month = parseInt(ymdMatch[2], 10)
    const day = parseInt(ymdMatch[3], 10)

    if (isValidDateParts(year, month, day)) {
      const d = new Date(year, month - 1, day, hours, minutes, seconds)
      if (!isNaN(d.getTime())) return d
    }
  }

  // 4. Format: DD Month YYYY (e.g. 26 Aug 2026, 26-August-2026, 26.August.2026)
  const dMonthYMatch = dateStr.match(/^(\d{1,2})[\s\/\-\.]+([a-zA-Z]{3,10})[\s\/\-\.]+(\d{2,4})/)
  if (dMonthYMatch) {
    const day = parseInt(dMonthYMatch[1], 10)
    const monthStr = dMonthYMatch[2].toLowerCase()
    let year = parseInt(dMonthYMatch[3], 10)
    if (year < 100) year += 2000

    const month = MONTH_NAMES[monthStr]
    if (month && isValidDateParts(year, month, day)) {
      const d = new Date(year, month - 1, day, hours, minutes, seconds)
      if (!isNaN(d.getTime())) return d
    }
  }

  // 5. Format: Month DD, YYYY (e.g. August 26, 2026)
  const monthDYMatch = dateStr.match(/^([a-zA-Z]{3,10})[\s\/\-\.]+(\d{1,2})(?:st|nd|rd|th)?,?[\s\/\-\.]+(\d{2,4})/)
  if (monthDYMatch) {
    const monthStr = monthDYMatch[1].toLowerCase()
    const day = parseInt(monthDYMatch[2], 10)
    let year = parseInt(monthDYMatch[3], 10)
    if (year < 100) year += 2000

    const month = MONTH_NAMES[monthStr]
    if (month && isValidDateParts(year, month, day)) {
      const d = new Date(year, month - 1, day, hours, minutes, seconds)
      if (!isNaN(d.getTime())) return d
    }
  }

  // 6. Compact format from filenames: YYYYMMDD or YYYYMMDDHHmmss (e.g. 20260826185857 or 20260826)
  const compactMatch = dateStr.match(/\b(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?:(\d{2})(\d{2})(\d{2}))?/)
  if (compactMatch) {
    const year = parseInt(compactMatch[1], 10)
    const month = parseInt(compactMatch[2], 10)
    const day = parseInt(compactMatch[3], 10)
    if (compactMatch[4] && compactMatch[5]) {
      hours = parseInt(compactMatch[4], 10)
      minutes = parseInt(compactMatch[5], 10)
      seconds = compactMatch[6] ? parseInt(compactMatch[6], 10) : 0
    }

    if (isValidDateParts(year, month, day)) {
      const d = new Date(year, month - 1, day, hours, minutes, seconds)
      if (!isNaN(d.getTime())) return d
    }
  }

  // 7. Last-ditch native Date parse (safeguarded)
  try {
    const fallback = new Date(str)
    if (!isNaN(fallback.getTime())) {
      // Basic sanity check: year between 1970 and 2100
      const y = fallback.getFullYear()
      if (y >= 1970 && y <= 2100) return fallback
    }
  } catch {
    // ignore
  }

  return null
}

function isValidDateParts(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2100) return false
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false

  // Validate day count per month
  const maxDays = new Date(year, month, 0).getDate()
  return day <= maxDays
}

/**
 * Returns a valid Date, or a safe default (like `new Date()`) if parsing fails.
 * NEVER returns Invalid Date.
 */
export function safeDate(input: unknown, fallback: Date | null = new Date()): Date | null {
  const parsed = parseReportDate(input)
  if (parsed && !isNaN(parsed.getTime())) return parsed
  if (fallback && !isNaN(fallback.getTime())) return fallback
  return null
}
