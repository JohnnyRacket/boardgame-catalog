import type { Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('games').addColumn('rulebook_url', 'varchar(1024)').execute()
  await db.schema.alterTable('games').addColumn('rules_summary', 'text').execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.alterTable('games').dropColumn('rules_summary').execute()
  await db.schema.alterTable('games').dropColumn('rulebook_url').execute()
}
