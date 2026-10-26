/** "3 hours ago" style times for the backoffice. Falls back to the date after a month. */
export function timeAgo(value: string | number | null | undefined, now = Date.now()): string {
  if (!value) return 'never'
  const then = typeof value === 'number' ? value : Date.parse(value)
  if (Number.isNaN(then)) return 'unknown'
  const s = Math.max(0, Math.round((now - then) / 1000))
  if (s < 60) return 'just now'
  const units: [number, string][] = [[60, 'minute'], [3600, 'hour'], [86400, 'day']]
  for (let i = units.length - 1; i >= 0; i--) {
    const [size, label] = units[i]!
    if (s >= size) {
      const n = Math.floor(s / size)
      if (label === 'day' && n >= 30) break
      return `${n} ${label}${n === 1 ? '' : 's'} ago`
    }
  }
  return new Date(then).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
