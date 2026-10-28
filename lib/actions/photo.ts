'use server'

import path from 'path'
import { writeFile, mkdir } from 'fs/promises'
import { randomUUID } from 'crypto'
import { generateText } from 'ai'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { isAuthenticated } from '@/lib/auth'
import { getBggGame, searchBgg } from '@/lib/bgg'
import { insertGame, upsertGenres, getGamesByNames } from '@/lib/db/queries'
import { llm, LLM_VISION_MODEL, describeLlmError } from '@/lib/llm'
import { addGameSchema } from '@/lib/validations/game'
import type { BggGameData, BggSearchResult } from '@/lib/types/bgg'

export type PhotoAddResult =
  | { status: 'added'; gameId: number; name: string }
  | { status: 'duplicate'; name: string }
  | { status: 'choose'; guess: string; candidates: BggSearchResult[] }
  | { status: 'error'; message: string; guess?: string }

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB (the client downscales before sending)

const identificationSchema = z.object({
  name: z.string().trim().min(1).nullable(),
  alt_names: z.array(z.string().trim().min(1)).catch([]),
  year: z.number().int().nullable().catch(null),
})

type Identification = z.infer<typeof identificationSchema>

async function identifyGame(image: Uint8Array, mediaType: string): Promise<Identification> {
  const result = await generateText({
    model: llm(LLM_VISION_MODEL),
    // Gemma reasons before answering; leave room for it
    maxOutputTokens: 2000,
    temperature: 0.2,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Identify the board game in this photo (usually its box). Read the title printed on it; use the artwork, publisher and edition only to tell versions apart.

Reply with only JSON, no other text:
{"name": string | null, "alt_names": string[], "year": number | null}

- name: the game's title as listed on BoardGameGeek, without edition words like "The Game" or "Board Game" unless they are part of the title. null if no board game is visible or the title can't be read.
- alt_names: at most 1 other name it is best known by (older title, or English title of a foreign edition). [] if none.
- year: the year this edition was first published if you know it, else null.`,
          },
          { type: 'file', data: image, mediaType },
        ],
      },
    ],
  })

  const text = result.text.trim()
  const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1)
  if (!json) throw new Error(`Model did not return JSON: ${text.slice(0, 200)}`)
  return identificationSchema.parse(JSON.parse(json))
}

/** Of several games sharing a name, prefer the guessed year, else the oldest BGG entry (usually the original) */
function pickBest(results: BggSearchResult[], year: number | null): BggSearchResult {
  const byId = [...results].sort((a, b) => a.id - b.id)
  return byId.find((r) => year && r.year === year) ?? byId[0]
}

async function savePhoto(photo: File): Promise<string> {
  const ext = photo.type === 'image/png' ? 'png' : photo.type === 'image/webp' ? 'webp' : 'jpg'
  const filename = `${randomUUID()}.${ext}`
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  await mkdir(uploadsDir, { recursive: true })
  await writeFile(path.join(uploadsDir, filename), Buffer.from(await photo.arrayBuffer()))
  return `/uploads/${filename}`
}

async function addFromBgg(bggId: number, photo?: File): Promise<PhotoAddResult> {
  let bgg: BggGameData | null
  try {
    bgg = await getBggGame(bggId)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { status: 'error', message: `Failed to fetch BGG data: ${msg}` }
  }
  if (!bgg?.name) return { status: 'error', message: 'Game not found on BGG.' }

  const existing = await getGamesByNames([bgg.name])
  if (existing.length > 0) return { status: 'duplicate', name: bgg.name }

  const minPlayers = bgg.min_players ?? 1
  const parsed = addGameSchema.safeParse({
    name: bgg.name,
    description: bgg.description?.slice(0, 5000),
    image_url: bgg.image_url,
    year_published: bgg.year_published,
    publisher: bgg.publisher,
    designer: bgg.designer,
    min_players: minPlayers,
    max_players: Math.max(bgg.max_players ?? minPlayers, minPlayers),
    min_age: bgg.min_age,
    min_play_time: bgg.min_play_time,
    max_play_time: bgg.max_play_time,
    complexity: bgg.complexity,
    best_with: bgg.best_with,
    genres: bgg.genres,
    user_rating: bgg.bgg_rating,
  })
  if (!parsed.success) {
    console.error('BGG data failed validation:', parsed.error)
    return { status: 'error', message: `BGG data for "${bgg.name}" didn't pass validation. Try adding it manually.` }
  }
  const data = parsed.data

  try {
    // Fall back to the user's photo when BGG has no box art
    const imageUrl = data.image_url || (photo ? await savePhoto(photo) : null)
    const game = await insertGame({
      name: data.name,
      description: data.description ?? null,
      image_url: imageUrl,
      rulebook_url: null,
      year_published: data.year_published ?? null,
      publisher: data.publisher ?? null,
      designer: data.designer ?? null,
      min_players: data.min_players,
      max_players: data.max_players,
      min_age: data.min_age ?? null,
      min_play_time: data.min_play_time ?? null,
      max_play_time: data.max_play_time ?? null,
      complexity: data.complexity ?? null,
      player_interaction: null,
      best_with: data.best_with ?? null,
      genres: data.genres?.length ? data.genres : null,
      user_rating: data.user_rating ?? null,
    })
    await upsertGenres(data.genres ?? [])
    revalidatePath('/games')
    return { status: 'added', gameId: game.id, name: game.name }
  } catch (err) {
    console.error('Failed to insert game:', err)
    return { status: 'error', message: 'Database error. Please try again.' }
  }
}

export async function addGameFromPhotoAction(formData: FormData): Promise<PhotoAddResult> {
  if (!(await isAuthenticated())) return { status: 'error', message: 'Unauthorized. Please sign in.' }

  const photo = formData.get('photo')
  if (!(photo instanceof File) || photo.size === 0) {
    return { status: 'error', message: 'No photo provided.' }
  }
  if (!ALLOWED_TYPES.includes(photo.type)) {
    return { status: 'error', message: 'Invalid file type. Allowed: JPEG, PNG, WebP' }
  }
  if (photo.size > MAX_SIZE) {
    return { status: 'error', message: 'Photo too large. Maximum size is 5MB' }
  }

  let id: Identification
  try {
    id = await identifyGame(new Uint8Array(await photo.arrayBuffer()), photo.type)
  } catch (err) {
    console.error('Game identification failed:', err)
    return { status: 'error', message: describeLlmError(err) }
  }
  if (!id.name) {
    return { status: 'error', message: "Couldn't make out a board game in that photo. Try a clearer shot of the box front." }
  }

  // Already own it? Then there's no need to ask BGG
  if ((await getGamesByNames([id.name])).length > 0) return { status: 'duplicate', name: id.name }

  // BGG requests are throttled to one per 5s (see lib/bgg.ts), so try at most two names
  const names = [...new Map([id.name, ...id.alt_names].map((n) => [n.toLowerCase(), n])).values()].slice(0, 2)

  try {
    for (const name of names) {
      const exact = await searchBgg(name, { exact: true })
      if (exact.length > 0) return addFromBgg(pickBest(exact, id.year).id, photo)
    }

    // No exact title match: let the user pick from a broader search
    const candidates = (await searchBgg(id.name)).slice(0, 8)
    if (candidates.length === 0) {
      return { status: 'error', message: `Gemma read "${id.name}" but BGG has no game by that name.`, guess: id.name }
    }
    return { status: 'choose', guess: id.name, candidates }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return { status: 'error', message: `Failed to search BGG: ${msg}`, guess: id.name }
  }
}

export async function addGameFromBggAction(bggId: number): Promise<PhotoAddResult> {
  if (!(await isAuthenticated())) return { status: 'error', message: 'Unauthorized. Please sign in.' }
  if (!Number.isInteger(bggId) || bggId <= 0) return { status: 'error', message: 'Invalid BGG id.' }
  return addFromBgg(bggId)
}
