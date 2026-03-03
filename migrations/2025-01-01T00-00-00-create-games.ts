import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('games')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('image_url', 'varchar(1024)')
    .addColumn('year_published', 'integer')
    .addColumn('publisher', 'varchar(255)')
    .addColumn('designer', 'varchar(255)')
    .addColumn('min_players', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('max_players', 'integer', (col) => col.notNull().defaultTo(1))
    .addColumn('min_age', 'integer')
    .addColumn('min_play_time', 'integer')
    .addColumn('max_play_time', 'integer')
    .addColumn('complexity', 'integer')
    .addColumn('player_interaction', sql`varchar(20)`)
    .addColumn('genres', sql`text[]`)
    .addColumn('user_rating', sql`decimal(3,1)`)
    .addColumn('created_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute()

  // GIN index for fast array overlap queries on genres
  await sql`
    CREATE INDEX games_genres_gin_idx ON games USING GIN (genres)
  `.execute(db)

  // btree indexes for common filter columns
  await db.schema
    .createIndex('games_complexity_idx')
    .on('games')
    .column('complexity')
    .execute()

  await db.schema
    .createIndex('games_user_rating_idx')
    .on('games')
    .column('user_rating')
    .execute()

  await db.schema
    .createIndex('games_player_interaction_idx')
    .on('games')
    .column('player_interaction')
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('games').execute()
}
