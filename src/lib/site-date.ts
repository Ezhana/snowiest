/**
 * Site calendar semantics.
 *
 * Frontmatter and moment filenames describe publication times in the author's local time, while the
 * site is built on machines with a different time zone (GitHub Actions uses UTC). This module is the
 * single source of truth for that conversion, so rendered dates and month grouping do not depend on
 * `process.env.TZ`.
 *
 * Dependency-free on purpose: `scripts/content.mjs` imports it from plain Node, outside Vite.
 */

/** The time zone the site's dates are written and displayed in. */
export const SITE_TIME_ZONE = 'Asia/Shanghai'

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const DATE_TIME_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/

const PARTS_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: SITE_TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

interface DateParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function partsAt(instant: number): DateParts {
  const parts = PARTS_FORMATTER.formatToParts(new Date(instant))
  const read = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((part) => part.type === type)?.value)

  return {
    year: read('year'),
    month: read('month'),
    day: read('day'),
    hour: read('hour'),
    minute: read('minute'),
    second: read('second'),
  }
}

/** Offset of the site time zone at `instant`, in milliseconds (`local - UTC`). */
function zoneOffsetMs(instant: number): number {
  const parts = partsAt(instant)
  const local = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  return local - instant
}

/** UTC instant of local midnight `year-month-day` in the site time zone. */
export function siteStartOfDay(year: number, month: number, day: number): Date {
  const local = Date.UTC(year, month - 1, day)
  const firstPass = local - zoneOffsetMs(local)
  return new Date(local - zoneOffsetMs(firstPass))
}

/** `YYYY-MM-DD` for `date`, read in the site time zone. */
export function siteDateKey(date: Date): string {
  const parts = partsAt(date.getTime())
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`
}

/** `YYYY-MM` for `date`, read in the site time zone. */
export function siteMonthKey(date: Date): string {
  const parts = partsAt(date.getTime())
  return `${parts.year}-${pad2(parts.month)}`
}

/** First day of `date`'s month, at midnight in the site time zone. */
export function siteMonthStart(date: Date): Date {
  const parts = partsAt(date.getTime())
  return siteStartOfDay(parts.year, parts.month, 1)
}

/**
 * Parse a frontmatter date. Accepted forms:
 *
 * - `YYYY-MM-DD`: midnight in the site time zone;
 * - ISO 8601 date-time with an explicit offset (`Z` or `±hh:mm`).
 *
 * Anything else (including `YYYY-M-D` and offset-less times) is rejected; invalid calendar dates
 * such as `2026-02-31` are rejected as well. Invalid input returns an invalid `Date`.
 */
export function parseSiteDate(value: string): Date {
  const trimmed = value.trim()

  if (DATE_ONLY.test(trimmed)) {
    const [year, month, day] = trimmed.split('-').map(Number)
    const date = siteStartOfDay(year, month, day)
    return siteDateKey(date) === trimmed ? date : new Date(Number.NaN)
  }

  if (DATE_TIME_WITH_OFFSET.test(trimmed)) return new Date(trimmed)

  return new Date(Number.NaN)
}
