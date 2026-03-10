import type { Game } from '@/lib/db/types'

export const GAME_CSV_HEADERS = [
  'name',
  'description',
  'image_url',
  'rulebook_url',
  'rules_summary',
  'year_published',
  'publisher',
  'designer',
  'min_players',
  'max_players',
  'min_age',
  'min_play_time',
  'max_play_time',
  'complexity',
  'player_interaction',
  'best_with',
  'genres',
  'user_rating',
] as const

export type GameCsvHeader = (typeof GAME_CSV_HEADERS)[number]

function escapeCell(value: string): string {
  const safe = value.replace(/\n/g, ' ').replace(/\r/g, '')
  if (safe.includes('"') || safe.includes(',')) {
    return `"${safe.replace(/"/g, '""')}"`
  }
  return safe
}

function parseCell(raw: string): string {
  if (raw.startsWith('"') && raw.endsWith('"')) {
    return raw.slice(1, -1).replace(/""/g, '"')
  }
  return raw
}

/** Serialise an array of Game rows to a CSV string (headers + data rows). */
export function gamesToCsv(games: Game[]): string {
  const header = GAME_CSV_HEADERS.join(',')
  const rows = games.map((g) => {
    return GAME_CSV_HEADERS.map((col) => {
      const v = g[col as keyof Game]
      if (v == null) return ''
      if (Array.isArray(v)) return escapeCell((v as string[]).join('|'))
      return escapeCell(String(v))
    }).join(',')
  })
  return [header, ...rows].join('\n')
}

/** Parse a CSV string back into an array of plain string-keyed objects. */
export function csvToRawRows(csv: string): Record<string, string>[] {
  const lines = csv.split('\n').filter(Boolean)
  if (lines.length < 2) return []
  const headers = lines[0].split(',')

  return lines.slice(1).map((line) => {
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (ch === ',' && !inQuotes) {
        values.push(parseCell(current))
        current = ''
      } else {
        current += ch
      }
    }
    values.push(parseCell(current))

    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']))
  })
}
