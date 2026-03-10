import Link from 'next/link'
import { Dices, Lock, HardDrive } from 'lucide-react'
import { AddGameButton } from '@/components/shared/AddGameButton'
import { isAuthenticated } from '@/lib/auth'

export async function Navbar() {
  const authenticated = await isAuthenticated()

  return (
    <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/games" className="flex items-center gap-2 font-semibold">
          <Dices className="h-5 w-5" />
          <span>BoardGame Catalog</span>
        </Link>
        {authenticated ? (
          <div className="flex items-center gap-3">
            <Link
              href="/backup"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <HardDrive className="h-4 w-4" />
              <span className="hidden sm:inline">Backup</span>
            </Link>
            <AddGameButton />
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <Lock className="h-4 w-4" />
          </Link>
        )}
      </div>
    </nav>
  )
}
