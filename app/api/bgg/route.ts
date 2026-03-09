import { NextRequest, NextResponse } from 'next/server'
import type { BggGameData, BggSearchResult } from '@/lib/types/bgg'
import { isAuthenticatedFromRequest } from '@/lib/auth'


function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&mdash;/g, '\u2014')
    .replace(/&ndash;/g, '\u2013')
    .replace(/&hellip;/g, '\u2026')
    .replace(/&nbsp;/g, ' ')
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

export async function GET(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter: q' }, { status: 400 })
  }

  const searchUrl = `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(q)}&type=boardgame`
  let xml: string
  try {
    xml = await fetchXml(searchUrl)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to fetch BGG data: ${msg}` }, { status: 502 })
  }

  // Parse all <item type="boardgame" id="..."> blocks
  const itemRe = /<item\s+type="boardgame"\s+id="(\d+)"[^>]*>([\s\S]*?)<\/item>/gi
  const results: BggSearchResult[] = []
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(xml)) !== null && results.length < 20) {
    const id = Number(m[1])
    const block = m[2]
    const nameMatch = block.match(/<name\s+type="primary"[^>]+value="([^"]*)"/i)
    const name = nameMatch ? decodeHtmlEntities(nameMatch[1]) : undefined
    if (!name) continue
    const yearMatch = block.match(/<yearpublished\s+value="(\d+)"/i)
    const year = yearMatch ? Number(yearMatch[1]) : undefined
    results.push({ id, name, ...(year ? { year } : {}) })
  }

  return NextResponse.json(results)
}

export async function POST(req: NextRequest) {
  if (!isAuthenticatedFromRequest(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  let body: { id?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const id = body.id
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: 'Body must include a positive integer "id"' }, { status: 400 })
  }

  const detailUrl = `https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1&ratingcomments=1`
  let xml: string
  try {
    xml = await fetchXml(detailUrl)
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
  const genres = xmlLinkValues(xml, 'boardgamecategory').map(decodeHtmlEntities).filter((g) => g.length <= 24)

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

  // Average community rating from stats block
  let bgg_rating: number | undefined
  const avgStr = xml.match(/<average\s+value="([^"]*)"/)?.[1]
  if (avgStr) {
    const avg = parseFloat(avgStr)
    if (avg > 0) bgg_rating = Math.round(avg * 10) / 10
  }

  // Best with: parse suggested_numplayers poll to find player count with most "Best" votes
  let best_with: number | undefined
  const pollMatch = xml.match(/<poll\s+name="suggested_numplayers"[\s\S]*?<\/poll>/)
  if (pollMatch) {
    const pollXml = pollMatch[0]
    const resultsRe = /<results\s+numplayers="(\d+)"[^>]*>([\s\S]*?)<\/results>/g
    let bestCount = 0
    let rm: RegExpExecArray | null
    while ((rm = resultsRe.exec(pollXml)) !== null) {
      const n = parseInt(rm[1], 10)
      const block = rm[2]
      const bestMatch = block.match(/<result\s+value="Best"\s+numvotes="(\d+)"/)
      if (bestMatch) {
        const votes = parseInt(bestMatch[1], 10)
        if (votes > bestCount) {
          bestCount = votes
          best_with = n
        }
      }
    }
    if (bestCount === 0) best_with = undefined
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
    bgg_rating,
    best_with,
  }

  return NextResponse.json(data)
}
