import Link from 'next/link'
import { Dices } from 'lucide-react'
import { AddGameButton } from '@/components/shared/AddGameButton'

export function Navbar() {
  return (
    <nav className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/games" className="flex items-center gap-2 font-semibold">
          <Dices className="h-5 w-5" />
          <span>BoardGame Catalog</span>
        </Link>
        <AddGameButton />
      </div>
    </nav>
  )
}
