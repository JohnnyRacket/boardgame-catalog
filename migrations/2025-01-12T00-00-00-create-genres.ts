import type { Kysely } from 'kysely'
import { sql } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('genres')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'text', (col) => col.notNull().unique())
    .execute()

  // Backfill from existing game data
  await sql`
    INSERT INTO genres (name)
    SELECT DISTINCT unnest(genres) FROM games WHERE genres IS NOT NULL
    ON CONFLICT (name) DO NOTHING
  `.execute(db)
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('genres').execute()
}
