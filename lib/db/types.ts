import type { Generated, ColumnType, Selectable, Insertable, Updateable } from 'kysely'

interface GenresTable {
  id: Generated<number>
  name: string
}

interface GamesTable {
  id: Generated<number>
  name: string
  description: string | null
  image_url: string | null
  rulebook_url: string | null
  rules_summary: string | null
  year_published: number | null
  publisher: string | null
  designer: string | null
  min_players: number
  max_players: number
  min_age: number | null
  min_play_time: number | null
  max_play_time: number | null
  complexity: number | null
  player_interaction: 'cooperative' | 'competitive' | 'hybrid' | null
  genres: string[] | null
  user_rating: number | null
  created_at: ColumnType<Date, string | undefined, never>
  updated_at: ColumnType<Date, string | undefined, string | undefined>
}

export interface Database {
  games: GamesTable
  genres: GenresTable
}

export type Game = Selectable<GamesTable>
export type NewGame = Insertable<GamesTable>
export type GameUpdate = Updateable<GamesTable>
