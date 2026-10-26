const KH_DIGITS = '០១២៣៤៥៦៧៨៩'
const KH_MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ']

export const kh = (n: number | string) => String(n).replace(/\d/g, (d) => KH_DIGITS[Number(d)]!)

export function khDate(now: Date) {
  return `${kh(now.getDate())} ${KH_MONTHS[now.getMonth()]} ${kh(now.getFullYear())}`
}
