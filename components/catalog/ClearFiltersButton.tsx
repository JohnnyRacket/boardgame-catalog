'use client'

import { useQueryStates } from 'nuqs'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { filterParsers } from '@/lib/validations/filters'

const clearState = {
  q: '',
  genres: [] as string[],
  interaction: '',
  players: null,
  complexity_min: 1,
  complexity_max: 5,
  play_time: [] as number[],
  rating_min: null,
  page: 1,
}

function useHasActiveFilters() {
  const [filters] = useQueryStates(filterParsers, { shallow: false })
  return (
    !!filters.q ||
    filters.genres.length > 0 ||
    !!filters.interaction ||
    filters.players !== null ||
    filters.complexity_min > 1 ||
    filters.complexity_max < 5 ||
    filters.play_time.length > 0 ||
    filters.rating_min !== null
  )
}

export function ClearFiltersButtonDesktop() {
  const [, setFilters] = useQueryStates(filterParsers, { shallow: false })
  const hasActive = useHasActiveFilters()

  if (!hasActive) return null

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => setFilters(clearState)}
      className="gap-1.5 shrink-0"
    >
      <X className="h-3.5 w-3.5" />
      Clear all
    </Button>
  )
}

export function ClearFiltersButtonMobile() {
  const [, setFilters] = useQueryStates(filterParsers, { shallow: false })
  const hasActive = useHasActiveFilters()

  if (!hasActive) return null

  return (
    <Button
      variant="destructive"
      className="w-full h-11 text-base font-semibold gap-2"
      onClick={() => setFilters(clearState)}
    >
      <X className="h-5 w-5" />
      Clear all filters
    </Button>
  )
}
