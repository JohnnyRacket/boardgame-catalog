import { Kysely, sql } from 'kysely'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function up(db: Kysely<any>): Promise<void> {
  await sql`UPDATE games SET player_interaction = 'teams' WHERE player_interaction = 'hybrid'`.execute(db)
  await db.schema.alterTable('games').addColumn('best_with', 'integer').execute()
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('games').dropColumn('best_with').execute()
  await sql`UPDATE games SET player_interaction = 'hybrid' WHERE player_interaction = 'teams'`.execute(db)
}
