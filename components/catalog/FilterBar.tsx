'use client'

import { useQueryStates } from 'nuqs'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { filterParsers } from '@/lib/validations/filters'
import { COMPLEXITY_LABELS } from '@/lib/constants'

export function FilterBar() {
  const [filters, setFilters] = useQueryStates(filterParsers, {
    shallow: false,
  })

  const chips: { label: string; onRemove: () => void }[] = []

  if (filters.q) {
    chips.push({
      label: `"${filters.q}"`,
      onRemove: () => setFilters({ q: '' }),
    })
  }

  filters.genres.forEach((genre) => {
    chips.push({
      label: genre,
      onRemove: () =>
        setFilters({ genres: filters.genres.filter((g) => g !== genre) }),
    })
  })

  if (filters.interaction) {
    chips.push({
      label: filters.interaction,
      onRemove: () => setFilters({ interaction: '' }),
    })
  }

  if (filters.players !== null) {
    chips.push({
      label: `${filters.players} players`,
      onRemove: () => setFilters({ players: null }),
    })
  }

  if (filters.complexity_min > 1 || filters.complexity_max < 5) {
    chips.push({
      label: `Complexity: ${COMPLEXITY_LABELS[filters.complexity_min]}–${COMPLEXITY_LABELS[filters.complexity_max]}`,
      onRemove: () => setFilters({ complexity_min: 1, complexity_max: 5 }),
    })
  }

  filters.play_time.forEach((t) => {
    const label = t >= 181 ? '3hr+' : t >= 60 ? `~${t / 60}h` : `~${t}m`
    chips.push({
      label,
      onRemove: () => setFilters({ play_time: filters.play_time.filter((v) => v !== t) }),
    })
  })

  if (filters.rating_min !== null) {
    chips.push({
      label: `Rating ≥${filters.rating_min}`,
      onRemove: () => setFilters({ rating_min: null }),
    })
  }

  if (chips.length === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <Badge
          key={chip.label}
          variant="secondary"
          className="gap-1 pr-1.5"
        >
          {chip.label}
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={chip.onRemove}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {chip.label} filter</span>
          </Button>
        </Badge>
      ))}
    </div>
  )
}
