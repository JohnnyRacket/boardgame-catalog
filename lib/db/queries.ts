import { sql } from 'kysely'
import { db } from './index'
import type { NewGame, GameUpdate } from './types'
import type { FilterValues } from '@/lib/validations/filters'

const SORT_MAP: Record<string, { col: string; dir: 'asc' | 'desc' }> = {
  name_asc: { col: 'name', dir: 'asc' },
  name_desc: { col: 'name', dir: 'desc' },
  rating_desc: { col: 'user_rating', dir: 'desc' },
  rating_asc: { col: 'user_rating', dir: 'asc' },
  year_desc: { col: 'year_published', dir: 'desc' },
  year_asc: { col: 'year_published', dir: 'asc' },
  time_asc: { col: 'min_play_time', dir: 'asc' },
  time_desc: { col: 'min_play_time', dir: 'desc' },
}

export const PAGE_SIZE = 48

export async function getFilteredGames(filters: Partial<FilterValues>) {
  let base = db.selectFrom('games')

  if (filters.q) {
    const term = `%${filters.q.toLowerCase()}%`
    base = base.where((eb) =>
      eb.or([
        eb(sql`lower(name)`, 'like', term),
        eb(sql`lower(description)`, 'like', term),
      ])
    )
  }

  if (filters.genres && filters.genres.length > 0) {
    const arr = sql`ARRAY[${sql.join(
      filters.genres.map((g) => sql.lit(g))
    )}]::text[]`
    base = base.where(sql<boolean>`genres && ${arr}`)
  }

  if (filters.interaction) {
    base = base.where(
      'player_interaction',
      '=',
      filters.interaction as 'cooperative' | 'competitive' | 'teams'
    )
  }

  if (filters.players != null) {
    base = base
      .where('min_players', '<=', filters.players)
      .where('max_players', '>=', filters.players)
  }

  if (filters.complexity_min != null && filters.complexity_min > 1) {
    base = base.where('complexity', '>=', filters.complexity_min)
  }

  if (filters.complexity_max != null && filters.complexity_max < 5) {
    base = base.where('complexity', '<=', filters.complexity_max)
  }

  if (filters.play_time && filters.play_time.length > 0) {
    const times = filters.play_time
    const has3hrPlus = times.some((t) => t >= 181)
    const finiteTimes = times.filter((t) => t < 181)
    base = base.where((eb) => {
      const conditions = []
      if (finiteTimes.length > 0) {
        const minSelected = Math.min(...finiteTimes)
        const maxSelected = Math.max(...finiteTimes)
        conditions.push(
          eb.and([
            eb('min_play_time', '<=', maxSelected),
            eb('max_play_time', '>=', minSelected),
          ])
        )
      }
      if (has3hrPlus) {
        conditions.push(eb('min_play_time', '>=', 180))
      }
      return eb.or(conditions)
    })
  }

  if (filters.rating_min != null) {
    base = base.where('user_rating', '>=', filters.rating_min)
  }

  const sortKey = filters.sort != null && filters.sort in SORT_MAP ? filters.sort : 'name_asc'
  const { col, dir } = SORT_MAP[sortKey]
  const page = filters.page ?? 1

  const [countResult, games] = await Promise.all([
    base.select(({ fn }) => fn.countAll<string>().as('count')).executeTakeFirstOrThrow(),
    base
      .selectAll()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .orderBy(col as any, dir)
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE)
      .execute(),
  ])

  const total = Number(countResult.count)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return { games, total, totalPages, page }
}

export async function insertGame(data: NewGame) {
  return db.insertInto('games').values(data).returningAll().executeTakeFirstOrThrow()
}

export async function getGenres(): Promise<string[]> {
  const rows = await db.selectFrom('genres').select('name').orderBy('name', 'asc').execute()
  return rows.map((r) => r.name)
}

export async function upsertGenres(names: string[]): Promise<void> {
  if (names.length === 0) return
  await db
    .insertInto('genres')
    .values(names.map((name) => ({ name })))
    .onConflict((oc) => oc.column('name').doNothing())
    .execute()
}

export async function getGamesByNames(names: string[]): Promise<string[]> {
  if (names.length === 0) return []
  const lower = names.map((n) => n.toLowerCase())
  const rows = await db
    .selectFrom('games')
    .select('name')
    .where(sql<boolean>`lower(name) = ANY(${sql.val(lower)}::text[])`)
    .execute()
  return rows.map((r) => r.name.toLowerCase())
}

export async function updateGame(id: number, data: GameUpdate): Promise<void> {
  await db.updateTable('games').set(data).where('id', '=', id).execute()
}

export async function getGameById(id: number) {
  return db.selectFrom('games').selectAll().where('id', '=', id).executeTakeFirst()
}

export async function updateGameRating(id: number, rating: number | null): Promise<void> {
  await db.updateTable('games').set({ user_rating: rating }).where('id', '=', id).execute()
}

export async function updateGameRulesSummary(id: number, summary: string): Promise<void> {
  await db.updateTable('games').set({ rules_summary: summary }).where('id', '=', id).execute()
}

export async function getAllGames() {
  return db.selectFrom('games').selectAll().orderBy('name', 'asc').execute()
}

export async function deleteAllGames(): Promise<void> {
  await db.deleteFrom('games').execute()
}
