interface Line { text: string, bullet: boolean }
export interface LineGroup { bullets: boolean, lines: string[] }

/** Consecutive bullets become one list; each plain line is its own paragraph. */
export function groupLines(lines: Line[]): LineGroup[] {
  const groups: LineGroup[] = []
  for (const line of lines) {
    const last = groups[groups.length - 1]
    if (line.bullet && last?.bullets) last.lines.push(line.text)
    else groups.push({ bullets: line.bullet, lines: [line.text] })
  }
  return groups
}
