import type { BggGameData, BggSearchResult } from '@/lib/types/bgg'

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

// BGG asks API users to keep requests to a minimum and throttles anything faster than
// roughly one request per 5 seconds; going over risks the API key being suspended.
// Every request goes through one queue spaced MIN_INTERVAL_MS apart, and responses are
// cached so retries and repeat lookups don't hit BGG again.
const MIN_INTERVAL_MS = 5_000
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const CACHE_MAX_ENTRIES = 500

type BggClientState = {
  queue: Promise<unknown>
  lastRequestAt: number
  cache: Map<string, { xml: string; expires: number }>
  inFlight: Map<string, Promise<string>>
}

// Global so dev HMR doesn't reset the throttle or cache
const globalForBgg = globalThis as unknown as { bggClient?: BggClientState }
const state = (globalForBgg.bggClient ??= {
  queue: Promise.resolve(),
  lastRequestAt: 0,
  cache: new Map(),
  inFlight: new Map(),
})

/** Run one BGG request after the previous one, at least MIN_INTERVAL_MS after it started */
function throttled(url: string): Promise<Response> {
  const run = state.queue.then(async () => {
    const wait = state.lastRequestAt + MIN_INTERVAL_MS - Date.now()
    if (wait > 0) await new Promise((r) => setTimeout(r, wait))
    state.lastRequestAt = Date.now()
    return fetch(url, { signal: AbortSignal.timeout(10_000), headers: bggHeaders() })
  })
  state.queue = run.catch(() => {})
  return run
}

async function fetchXmlUncached(url: string): Promise<string> {
  let res = await throttled(url)

  // BGG occasionally queues requests and returns 202 — retry once
  if (res.status === 202) res = await throttled(url)

  if (res.status === 429 || res.status === 503) {
    throw new Error(`BGG is rate limiting requests (HTTP ${res.status}). Try again in a minute.`)
  }
  if (!res.ok) throw new Error(`BGG returned HTTP ${res.status}`)
  return res.text()
}

async function fetchXml(url: string): Promise<string> {
  const cached = state.cache.get(url)
  if (cached && cached.expires > Date.now()) return cached.xml

  // Concurrent lookups of the same URL share one request
  const pending = state.inFlight.get(url)
  if (pending) return pending

  const request = fetchXmlUncached(url)
    .then((xml) => {
      state.cache.delete(url)
      state.cache.set(url, { xml, expires: Date.now() + CACHE_TTL_MS })
      // Map keeps insertion order, so the first key is the oldest entry
      if (state.cache.size > CACHE_MAX_ENTRIES) state.cache.delete(state.cache.keys().next().value!)
      return xml
    })
    .finally(() => state.inFlight.delete(url))
  state.inFlight.set(url, request)
  return request
}

/** `exact` only returns games whose primary or alternate name equals the query */
export async function searchBgg(q: string, { exact = false } = {}): Promise<BggSearchResult[]> {
  const xml = await fetchXml(
    `https://boardgamegeek.com/xmlapi2/search?query=${encodeURIComponent(q)}&type=boardgame${exact ? '&exact=1' : ''}`
  )

  // Parse all <item type="boardgame" id="..."> blocks
  const itemRe = /<item\s+type="boardgame"\s+id="(\d+)"[^>]*>([\s\S]*?)<\/item>/gi
  const results: BggSearchResult[] = []
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(xml)) !== null && results.length < 20) {
    const id = Number(m[1])
    const block = m[2]
    const nameMatch = block.match(/<name\s+type="(?:primary|alternate)"[^>]+value="([^"]*)"/i)
    const name = nameMatch ? decodeHtmlEntities(nameMatch[1]) : undefined
    if (!name) continue
    const yearMatch = block.match(/<yearpublished\s+value="(\d+)"/i)
    const year = yearMatch ? Number(yearMatch[1]) : undefined
    results.push({ id, name, ...(year ? { year } : {}) })
  }

  return results
}

/** Returns null when BGG has no game with this id */
export async function getBggGame(id: number): Promise<BggGameData | null> {
  const xml = await fetchXml(`https://boardgamegeek.com/xmlapi2/thing?id=${id}&stats=1&ratingcomments=1`)

  if (xml.includes('<error>') || !xml.includes('<item ')) return null

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

  return data
}
