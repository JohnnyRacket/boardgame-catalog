import { redirect } from 'next/navigation'
import { isAuthenticated } from '@/lib/auth'
import { BackupClient } from '@/components/backup/BackupClient'

export const metadata = {
  title: 'Backup & Restore',
}

export default async function BackupPage() {
  const authenticated = await isAuthenticated()
  if (!authenticated) redirect('/login')

  return (
    <div className="container mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold mb-2">Backup & Restore</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Export your entire catalog to a ZIP file, or restore from a previously exported backup.
      </p>
      <BackupClient />
    </div>
  )
}
