'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { addGameSchema } from '@/lib/validations/game'
import { insertGame, upsertGenres, updateGameRating, updateGame, getGamesByNames } from '@/lib/db/queries'
import { isAuthenticated } from '@/lib/auth'

export type ActionState = {
  errors?: Record<string, string[]>
  message?: string
}

export async function addGameAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await isAuthenticated())) return { message: 'Unauthorized. Please sign in.' }
  const raw = {
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    image_url: formData.get('image_url') || undefined,
    rulebook_url: formData.get('rulebook_url') || undefined,
    year_published: formData.get('year_published') || undefined,
    publisher: formData.get('publisher') || undefined,
    designer: formData.get('designer') || undefined,
    min_players: formData.get('min_players'),
    max_players: formData.get('max_players'),
    min_age: formData.get('min_age') || undefined,
    min_play_time: formData.get('min_play_time') || undefined,
    max_play_time: formData.get('max_play_time') || undefined,
    complexity: formData.get('complexity') || undefined,
    player_interaction: formData.get('player_interaction') || undefined,
    best_with: formData.get('best_with') || undefined,
    genres: formData
      .get('genres_hidden')
      ?.toString()
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean),
    user_rating: formData.get('user_rating') || undefined,
  }

  const result = addGameSchema.safeParse(raw)

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      message: 'Please fix the errors below.',
    }
  }

  const data = result.data

  const existing = await getGamesByNames([data.name])
  if (existing.length > 0) {
    return {
      errors: { name: [`"${data.name}" is already in your collection.`] },
      message: 'This game already exists in your catalog.',
    }
  }

  try {
    await insertGame({
      name: data.name,
      description: data.description ?? null,
      image_url: data.image_url || null,
      rulebook_url: data.rulebook_url || null,
      year_published: data.year_published ?? null,
      publisher: data.publisher ?? null,
      designer: data.designer ?? null,
      min_players: data.min_players,
      max_players: data.max_players,
      min_age: data.min_age ?? null,
      min_play_time: data.min_play_time ?? null,
      max_play_time: data.max_play_time ?? null,
      complexity: data.complexity ?? null,
      player_interaction: data.player_interaction ?? null,
      best_with: data.best_with ?? null,
      genres: data.genres?.length ? data.genres : null,
      user_rating: data.user_rating ?? null,
    })
    await upsertGenres(data.genres ?? [])
  } catch (err) {
    console.error('Failed to insert game:', err)
    return { message: 'Database error. Please try again.' }
  }

  revalidatePath('/games')
  redirect('/games')
}

export async function updateGameAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await isAuthenticated())) return { message: 'Unauthorized. Please sign in.' }
  const rawId = formData.get('game_id')
  const id = rawId ? parseInt(rawId.toString(), 10) : NaN
  if (isNaN(id)) return { message: 'Invalid game ID.' }

  const raw = {
    name: formData.get('name'),
    description: formData.get('description') || undefined,
    image_url: formData.get('image_url') || undefined,
    rulebook_url: formData.get('rulebook_url') || undefined,
    year_published: formData.get('year_published') || undefined,
    publisher: formData.get('publisher') || undefined,
    designer: formData.get('designer') || undefined,
    min_players: formData.get('min_players'),
    max_players: formData.get('max_players'),
    min_age: formData.get('min_age') || undefined,
    min_play_time: formData.get('min_play_time') || undefined,
    max_play_time: formData.get('max_play_time') || undefined,
    complexity: formData.get('complexity') || undefined,
    player_interaction: formData.get('player_interaction') || undefined,
    best_with: formData.get('best_with') || undefined,
    genres: formData
      .get('genres_hidden')
      ?.toString()
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean),
  }

  const result = addGameSchema.safeParse(raw)

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors as Record<string, string[]>,
      message: 'Please fix the errors below.',
    }
  }

  const data = result.data

  try {
    await updateGame(id, {
      name: data.name,
      description: data.description ?? null,
      image_url: data.image_url || null,
      rulebook_url: data.rulebook_url || null,
      year_published: data.year_published ?? null,
      publisher: data.publisher ?? null,
      designer: data.designer ?? null,
      min_players: data.min_players,
      max_players: data.max_players,
      min_age: data.min_age ?? null,
      min_play_time: data.min_play_time ?? null,
      max_play_time: data.max_play_time ?? null,
      complexity: data.complexity ?? null,
      player_interaction: data.player_interaction ?? null,
      best_with: data.best_with ?? null,
      genres: data.genres?.length ? data.genres : null,
    })
    await upsertGenres(data.genres ?? [])
  } catch (err) {
    console.error('Failed to update game:', err)
    return { message: 'Database error. Please try again.' }
  }

  revalidatePath('/')
  revalidatePath('/games', 'page')
  redirect(`/games?game=${id}`)
}

export async function updateRatingAction(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  if (!(await isAuthenticated())) return { message: 'Unauthorized. Please sign in.' }
  const rawId = formData.get('game_id')
  const rawRating = formData.get('rating')

  const id = rawId ? parseInt(rawId.toString(), 10) : NaN
  if (isNaN(id)) return { message: 'Invalid game ID.' }

  const rating = rawRating && rawRating.toString().trim() !== ''
    ? parseFloat(rawRating.toString())
    : null

  if (rating !== null && (isNaN(rating) || rating < 1 || rating > 10)) {
    return { message: 'Rating must be between 1 and 10.' }
  }

  try {
    await updateGameRating(id, rating)
  } catch (err) {
    console.error('Failed to update rating:', err)
    return { message: 'Database error. Please try again.' }
  }

  revalidatePath('/')
  revalidatePath('/games/[id]', 'page')
  return {}
}

export async function checkDuplicateNamesAction(names: string[]): Promise<string[]> {
  if (!(await isAuthenticated())) return []
  return getGamesByNames(names)
}

export async function updateRatingDirectAction(
  gameId: number,
  rating: number | null
): Promise<ActionState> {
  if (!(await isAuthenticated())) return { message: 'Unauthorized. Please sign in.' }
  if (rating !== null && (isNaN(rating) || rating < 1 || rating > 10)) {
    return { message: 'Rating must be between 1 and 10.' }
  }

  try {
    await updateGameRating(gameId, rating)
  } catch (err) {
    console.error('Failed to update rating:', err)
    return { message: 'Database error. Please try again.' }
  }

  revalidatePath('/')
  revalidatePath('/games/[id]', 'page')
  return {}
}
