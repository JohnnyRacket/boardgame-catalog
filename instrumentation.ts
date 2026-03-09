export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { db } = await import('./lib/db')
    const { Migrator, FileMigrationProvider } = await import('kysely')
    const { promises: fs } = await import('fs')
    const path = await import('path')

    const migrator = new Migrator({
      db,
      provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder: path.join(process.cwd(), 'migrations'),
      }),
    })

    const { error, results } = await migrator.migrateToLatest()

    for (const result of results ?? []) {
      if (result.status === 'Success') {
        console.log(`Migration "${result.migrationName}" applied successfully`)
      } else if (result.status === 'Error') {
        console.error(`Migration "${result.migrationName}" failed`)
      }
    }

    if (error) {
      const isConnErr =
        (error as { code?: string }).code === 'ECONNREFUSED' ||
        (error as { message?: string }).message?.includes('ECONNREFUSED') ||
        (error as { message?: string }).message?.includes('connect')
      if (isConnErr) {
        console.warn('Database unavailable at startup — skipping migrations. App will show error pages.')
      } else {
        console.error('Migration failed:', error)
        process.exit(1)
      }
    }
  }
}
