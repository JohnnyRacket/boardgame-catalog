import { NextRequest, NextResponse } from 'next/server'
import type { BggGameData } from '@/lib/types/bgg'

const BGG_URL_RE = /^https:\/\/boardgamegeek\.com\/boardgame\/(\d+)\/[\w-]+$/

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function stripHtml(html: string): string {
  const decoded = decodeHtmlEntities(html)
  return decoded.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function coercePositiveInt(val: string | undefined): number | undefined {
  if (!val) return undefined
  const n = Number(val)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined
}

/** Get a `value="..."` attribute from a self-closing XML tag */
function xmlTagAttr(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]+value="([^"]*)"`, 'i')
  return xml.match(re)?.[1]
}

/** Get the text content between open/close tags (handles CDATA) */
function xmlTagText(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = xml.match(re)
  if (!m) return undefined
  // Strip CDATA wrapper if present
  return m[1].replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '')
}

/** Collect all `value="..."` from <link type="..." ...> elements */
function xmlLinkValues(xml: string, type: string): string[] {
  const re = new RegExp(`<link\\s+type="${type}"[^>]+value="([^"]*)"`, 'gi')
  const results: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) results.push(m[1])
  return results
}

function bggHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'User-Agent': 'boardgame-catalog/1.0',
    Accept: 'text/xml',
  }
  if (process.env.BGG_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.BGG_API_KEY}`
  }
  return headers
}

async function fetchXml(url: string): Promise<string> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(10_000),
    headers: bggHeaders(),
  })

  // BGG occasionally queues requests and returns 202 — retry once
  if (res.status === 202) {
    await new Promise((r) => setTimeout(r, 2500))
    const retry = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: bggHeaders(),
    })
    if (!retry.ok) throw new Error(`BGG returned HTTP ${retry.status}`)
    return retry.text()
  }

  if (!res.ok) throw new Error(`BGG returned HTTP ${res.status}`)
  return res.text()
}

export async function POST(req: NextRequest) {
  let body: { url?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const urlMatch = body.url?.match(BGG_URL_RE)
  if (!urlMatch) {
    return NextResponse.json(
      {
        error:
          'Invalid BoardGameGeek URL. Expected format: https://boardgamegeek.com/boardgame/123/game-name',
      },
      { status: 400 }
    )
  }

  const gameId = urlMatch[1]

  let xml: string
  try {
    xml = await fetchXml(
      `https://boardgamegeek.com/xmlapi2/thing?id=${gameId}&stats=1`
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to fetch BGG data: ${msg}` }, { status: 502 })
  }

  if (xml.includes('<error>') || !xml.includes('<item ')) {
    return NextResponse.json({ error: 'Game not found on BGG' }, { status: 422 })
  }

  // Primary name
  const name = xml.match(/<name\s+type="primary"[^>]+value="([^"]*)"/)?.[1]

  // Numeric fields
  const year_published = coercePositiveInt(xmlTagAttr(xml, 'yearpublished'))
  const min_players = coercePositiveInt(xmlTagAttr(xml, 'minplayers'))
  const max_players = coercePositiveInt(xmlTagAttr(xml, 'maxplayers'))
  const min_play_time = coercePositiveInt(xmlTagAttr(xml, 'minplaytime'))
  const max_play_time = coercePositiveInt(xmlTagAttr(xml, 'maxplaytime'))
  const min_age = coercePositiveInt(xmlTagAttr(xml, 'minage'))

  // Description (XML API wraps it in CDATA with HTML entities)
  const rawDesc = xmlTagText(xml, 'description')
  const description = rawDesc ? stripHtml(rawDesc) : undefined

  // Image (use full <image> tag, not thumbnail)
  const image_url = xmlTagText(xml, 'image')?.trim() || undefined

  // Genres from boardgamecategory links
  const genres = xmlLinkValues(xml, 'boardgamecategory')

  // Designer (first entry)
  const designer = xmlLinkValues(xml, 'boardgamedesigner')[0]

  // Publisher (first entry)
  const publisher = xmlLinkValues(xml, 'boardgamepublisher')[0]

  // Complexity from averageweight
  let complexity: number | undefined
  const weightStr = xml.match(/<averageweight\s+value="([^"]*)"/)?.[1]
  if (weightStr) {
    const w = parseFloat(weightStr)
    if (w > 0) complexity = Math.max(1, Math.min(5, Math.round(w)))
  }

  const data: BggGameData = {
    name,
    year_published,
    min_players,
    max_players,
    min_play_time,
    max_play_time,
    min_age,
    description,
    genres: genres.length > 0 ? genres : undefined,
    complexity,
    image_url,
    designer,
    publisher,
  }

  return NextResponse.json(data)
}
