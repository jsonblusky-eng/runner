import {
  differenceInCalendarYears,
  endOfMonth,
  endOfWeek,
  format,
  isSameYear,
  parseISO,
  startOfMonth,
  startOfWeek,
  subDays,
  subWeeks,
} from 'date-fns'

export type WeekStartsOn = 0 | 1

export interface DateRange {
  startISO: string
  endISO: string
  startDate: Date
  endDate: Date
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

export function todayISO(now: Date = new Date()): string {
  return toISODate(now)
}

export function fromISODate(iso: string): Date {
  return parseISO(`${iso}T00:00:00`)
}

export function getWeekRange(
  date: Date,
  weekStartsOn: WeekStartsOn = 1,
): DateRange {
  const startDate = startOfWeek(date, { weekStartsOn })
  const endDate = endOfWeek(date, { weekStartsOn })
  return {
    startDate,
    endDate,
    startISO: toISODate(startDate),
    endISO: toISODate(endDate),
  }
}

export function getMonthRange(date: Date): DateRange {
  const startDate = startOfMonth(date)
  const endDate = endOfMonth(date)
  return {
    startDate,
    endDate,
    startISO: toISODate(startDate),
    endISO: toISODate(endDate),
  }
}

export function getDayRange(date: Date): DateRange {
  const iso = toISODate(date)
  return { startISO: iso, endISO: iso, startDate: date, endDate: date }
}

export function isISOWithin(iso: string, range: DateRange): boolean {
  return iso >= range.startISO && iso <= range.endISO
}

export interface WeekBucket {
  startISO: string
  endISO: string
  label: string
  isCurrent: boolean
}

export function getLastWeekBuckets(
  now: Date,
  count: number,
  weekStartsOn: WeekStartsOn = 1,
): WeekBucket[] {
  const currentStart = startOfWeek(now, { weekStartsOn })
  const buckets: WeekBucket[] = []

  for (let index = count - 1; index >= 0; index -= 1) {
    const weekStart = subWeeks(currentStart, index)
    const weekEnd = endOfWeek(weekStart, { weekStartsOn })
    buckets.push({
      startISO: toISODate(weekStart),
      endISO: toISODate(weekEnd),
      label: format(weekStart, 'd MMM'),
      isCurrent: index === 0,
    })
  }

  return buckets
}

export function formatLongDate(date: Date): string {
  return format(date, 'EEEE, d MMMM')
}

export function formatFriendlyDate(
  iso: string,
  now: Date = new Date(),
): string {
  const date = fromISODate(iso)
  const today = toISODate(now)
  const yesterday = toISODate(subDays(now, 1))

  if (iso === today) return 'Today'
  if (iso === yesterday) return 'Yesterday'
  if (isSameYear(date, now)) return format(date, 'EEE d MMM')
  return format(date, 'd MMM yyyy')
}

export function formatDateWithYear(iso: string): string {
  return format(fromISODate(iso), 'd MMM yyyy')
}

export function formatMonthLabel(monthKey: string): string {
  return format(parseISO(`${monthKey}-01T00:00:00`), 'MMMM yyyy')
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

export function monthTotalLabel(iso: string, now: Date = new Date()): string {
  const date = fromISODate(iso)
  return differenceInCalendarYears(date, now) === 0
    ? format(date, 'MMMM')
    : format(date, 'MMMM yyyy')
}
