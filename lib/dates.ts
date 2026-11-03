// Calendar-day math in the viewer's time zone. Day keys are "YYYY-MM-DD" strings.

const keyFormatters = new Map<string, Intl.DateTimeFormat>()
const partFormatters = new Map<string, Intl.DateTimeFormat>()

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz })
    return true
  } catch {
    return false
  }
}

export function resolveTimeZone(tz?: string | null): string {
  if (tz && tz.length < 64 && isValidTimeZone(tz)) return tz
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"
}

export function dayKey(date: Date, tz: string): string {
  let fmt = keyFormatters.get(tz)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" })
    keyFormatters.set(tz, fmt)
  }
  return fmt.format(date)
}

function tzOffsetMs(instant: Date, tz: string): number {
  let fmt = partFormatters.get(tz)
  if (!fmt) {
    fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    partFormatters.set(tz, fmt)
  }
  const parts = fmt.formatToParts(instant)
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"))
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000
}

/** The UTC instant at which the given local calendar day begins in `tz`. */
export function zonedMidnight(key: string, tz: string): Date {
  const [y, m, d] = key.split("-").map(Number)
  const guess = Date.UTC(y, m - 1, d)
  const offset = tzOffsetMs(new Date(guess), tz)
  let ts = guess - offset
  const corrected = tzOffsetMs(new Date(ts), tz)
  if (corrected !== offset) ts = guess - corrected
  return new Date(ts)
}

export function startOfDayTz(date: Date, tz: string): Date {
  return zonedMidnight(dayKey(date, tz), tz)
}

export function addDaysToKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + days))
  return t.toISOString().slice(0, 10)
}

export function diffKeys(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number)
  const [by, bm, bd] = b.split("-").map(Number)
  return Math.round((Date.UTC(ay, am - 1, ad) - Date.UTC(by, bm - 1, bd)) / 86_400_000)
}

/** Local midnight `days` after the start of `date`'s day — used to schedule reviews by calendar day. */
export function dueDateAfter(date: Date, days: number, tz: string): Date {
  return zonedMidnight(addDaysToKey(dayKey(date, tz), days), tz)
}

/** Parses a day key as a local date for display purposes in the browser. */
export function keyToLocalDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number)
  return new Date(y, m - 1, d)
}
