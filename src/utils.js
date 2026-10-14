/**
 * Local storage helpers with JSON serialization
 */
export function loadData(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key)
    return raw !== null ? JSON.parse(raw) : defaultValue
  } catch {
    return defaultValue
  }
}

export function saveData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.warn('Storage error:', e)
  }
}

// ── Date helpers ──────────────────────────────────────────────────────────────

/** Returns "YYYY-MM-DD" for a Date object */
export function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Returns "YYYY-MM-DD" for today */
export function todayStr() {
  return toDateStr(new Date())
}

/** Parses "YYYY-MM-DD" → Date at noon local time (avoids UTC offset issues) */
export function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d, 12)
}

/** Difference in calendar days between two "YYYY-MM-DD" strings */
export function daysBetween(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86400000)
}

/** Add `n` days to a "YYYY-MM-DD" string */
export function addDays(dateStr, n) {
  const d = parseDate(dateStr)
  d.setDate(d.getDate() + n)
  return toDateStr(d)
}

/** Returns short day name like "Mon" */
export function shortDay(dateStr) {
  return parseDate(dateStr).toLocaleDateString('en-US', { weekday: 'short' })
}

/** Returns e.g. "Oct 15" */
export function shortDate(dateStr) {
  return parseDate(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Returns e.g. "October 2026" */
export function monthLabel(year, month) {
  return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Number of days in a month */
export function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

/** Gets the weekday index (0=Sun) of the first day of the month */
export function firstWeekdayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

// ── Cycle Computation ─────────────────────────────────────────────────────────

/**
 * Given sorted period start dates (newest last), compute next predicted dates.
 */
export function computeCycle(periodStarts, avgCycleLength = 28, avgPeriodLength = 5) {
  const sorted = [...periodStarts].sort()

  // Recalculate average cycle from actual data (last 6 cycles)
  if (sorted.length >= 2) {
    const gaps = []
    for (let i = 1; i < sorted.length; i++) {
      const g = daysBetween(sorted[i - 1], sorted[i])
      if (g >= 14 && g <= 60) gaps.push(g) // sanity check
    }
    const recent = gaps.slice(-6)
    if (recent.length > 0) {
      avgCycleLength = Math.round(recent.reduce((a, b) => a + b, 0) / recent.length)
    }
  }

  const last = sorted[sorted.length - 1] || todayStr()
  const cycleDay = sorted.length > 0 ? daysBetween(last, todayStr()) + 1 : 0
  const nextPeriod = addDays(last, avgCycleLength)
  const ovulation = addDays(last, avgCycleLength - 14)
  const fertileStart = addDays(ovulation, -5)
  const fertileEnd = addDays(ovulation, 1)

  const daysUntilNext = daysBetween(todayStr(), nextPeriod)

  return {
    avgCycleLength,
    avgPeriodLength,
    lastPeriodStart: last,
    nextPeriodStart: nextPeriod,
    ovulationDate: ovulation,
    fertileWindowStart: fertileStart,
    fertileWindowEnd: fertileEnd,
    cycleDay: Math.max(0, cycleDay),
    daysUntilNext,
  }
}

/**
 * Classify what phase a given date is in, given cycle info.
 * Returns: "period" | "fertile" | "ovulation" | "luteal" | "follicular" | "future-period" | null
 */
export function getPhaseForDate(dateStr, periodStarts, periodDays, avgPeriodLength, cycleInfo) {
  // Is it a logged period day?
  if (periodDays && periodDays[dateStr]) return 'period'

  // Mark predicted future period
  if (cycleInfo && dateStr >= cycleInfo.nextPeriodStart) {
    const daysIn = daysBetween(cycleInfo.nextPeriodStart, dateStr)
    if (daysIn < avgPeriodLength) return 'future-period'
  }

  if (!cycleInfo || !cycleInfo.lastPeriodStart) return null

  const { fertileWindowStart, fertileWindowEnd, ovulationDate } = cycleInfo

  if (dateStr === ovulationDate) return 'ovulation'
  if (dateStr >= fertileWindowStart && dateStr <= fertileWindowEnd) return 'fertile'

  return null
}

// ── PIN helpers ───────────────────────────────────────────────────────────────

export function hashPin(pin) {
  // Simple deterministic hash for a 4-digit PIN (not crypto-secure,
  // but adequate for privacy-screen lock on a personal device)
  let h = 0x811c9dc5
  for (const c of String(pin)) {
    h ^= c.charCodeAt(0)
    h = (h * 0x01000193) >>> 0
  }
  return h.toString(16)
}
