'use client'

import { useQueryState } from 'nuqs'
import { parseAsString } from 'nuqs'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function SearchBar() {
  const [q, setQ] = useQueryState('q', parseAsString.withDefault(''))

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9"
        placeholder="Search games…"
        value={q}
        onChange={(e) => setQ(e.target.value || null)}
      />
    </div>
  )
}
