/**
 * Moment filename format.
 *
 * Kept dependency-free so the content loader, the query layer and the CLI share one definition.
 */

const MOMENT_ID = /^(\d{4})-(\d{2})-(\d{2})T(\d{2})-(\d{2})-(\d{2})([+-]\d{2})(\d{2})$/

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Filename id for `date`: local time plus its UTC offset, e.g. `2026-11-17T18-30-00+0800`. */
export function momentIdFromDate(date: Date): string {
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? '+' : '-'
  const absolute = Math.abs(offset)

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}` +
    `${sign}${pad(Math.floor(absolute / 60))}${pad(absolute % 60)}`
  )
}

/** Publication time derived from a moment id (its timestamp filename, without extension). */
export function momentDateFromId(id: string): Date {
  const match = MOMENT_ID.exec(id)
  if (!match) {
    throw new Error(
      `Moment "${id}" must use a timestamp filename, e.g. 2026-11-17T18-30-00+0800.md.`,
    )
  }

  const [, year, month, day, hour, minute, second, offsetHour, offsetMinute] = match
  const date = new Date(
    `${year}-${month}-${day}T${hour}:${minute}:${second}${offsetHour}:${offsetMinute}`,
  )

  if (Number.isNaN(date.getTime())) {
    throw new Error(`Moment "${id}" has an invalid timestamp filename.`)
  }

  return date
}
