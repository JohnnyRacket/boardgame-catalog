'use client'

import { useQueryStates } from 'nuqs'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { COMPLEXITY_LABELS } from '@/lib/constants'
import { filterParsers } from '@/lib/validations/filters'
import { Star, Users, Clock, Gauge, Shuffle, Tag } from 'lucide-react'

const PLAYER_OPTIONS = [1, 2, 3, 4, 5, 6, 7] as const

const TIME_PRESETS = [
  { label: '15m', value: 15 },
  { label: '30m', value: 30 },
  { label: '1h',  value: 60 },
  { label: '90m', value: 90 },
  { label: '2h',  value: 120 },
  { label: '3hr+', value: 181 },
]

const COMPLEXITY_STEPS = [
  { value: 1, label: 'Easy',   activeClass: 'bg-emerald-500 border-emerald-500 text-white' },
  { value: 2, label: 'Light',  activeClass: 'bg-green-500  border-green-500  text-white' },
  { value: 3, label: 'Med',    activeClass: 'bg-yellow-500 border-yellow-500 text-black' },
  { value: 4, label: 'Heavy',  activeClass: 'bg-orange-500 border-orange-500 text-white' },
  { value: 5, label: 'Expert', activeClass: 'bg-red-500    border-red-500    text-white' },
]

const INTERACTION_OPTIONS = [
  { value: 'cooperative', label: 'Co-op',       emoji: '🤝' },
  { value: 'competitive', label: 'Competitive', emoji: '⚔️' },
]

function SectionLabel({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
      <Icon className="h-3 w-3" />
      {label}
    </div>
  )
}

interface FilterSidebarProps {
  genres: string[]
}

export function FilterSidebar({ genres }: FilterSidebarProps) {
  const [filters, setFilters] = useQueryStates(filterParsers, { shallow: false })

  const set = (updates: Partial<typeof filters>) => setFilters({ ...updates, page: 1 })

  const isFiltered =
    filters.genres.length > 0 ||
    filters.interaction ||
    filters.players !== null ||
    filters.complexity_min > 1 ||
    filters.complexity_max < 5 ||
    filters.play_time !== null ||
    filters.rating_min !== null

  function clearFilters() {
    setFilters({
      q: filters.q,
      genres: [],
      interaction: '',
      players: null,
      complexity_min: 1,
      complexity_max: 5,
      play_time: null,
      rating_min: null,
      page: 1,
    })
  }

  // Complexity range chip logic
  const isComplexityFiltered = !(filters.complexity_min === 1 && filters.complexity_max === 5)
  function isComplexityInRange(v: number) {
    return isComplexityFiltered && v >= filters.complexity_min && v <= filters.complexity_max
  }
  function handleComplexityClick(value: number) {
    const { complexity_min: min, complexity_max: max } = filters
    if (!isComplexityFiltered) {
      set({ complexity_min: value, complexity_max: value })
    } else if (value === min && value === max) {
      set({ complexity_min: 1, complexity_max: 5 })
    } else if (value < min) {
      set({ complexity_min: value })
    } else if (value > max) {
      set({ complexity_max: value })
    } else if (value === min) {
      set({ complexity_min: min + 1 })
    } else if (value === max) {
      set({ complexity_max: max - 1 })
    }
  }

  function toggleGenre(genre: string) {
    const updated = filters.genres.includes(genre)
      ? filters.genres.filter((g) => g !== genre)
      : [...filters.genres, genre]
    set({ genres: updated })
  }

  const pillBase = 'rounded-full border text-sm font-medium transition-colors'
  const pillOff  = 'border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground'
  const pillOn   = 'border-foreground bg-foreground text-background'

  return (
    <aside className="flex w-full flex-col gap-5 lg:w-60 xl:w-64">

      {/* Clear all */}
      {isFiltered && (
        <div className="flex items-center justify-end">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      {/* Players */}
      <div className="space-y-2.5">
        <SectionLabel icon={Users} label="Players" />
        <div className="flex flex-wrap gap-1.5">
          {PLAYER_OPTIONS.map((n) => {
            const selected = filters.players === n
            return (
              <button
                key={n}
                onClick={() => set({ players: selected ? null : n })}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium transition-colors',
                  selected ? pillOn : pillOff
                )}
              >
                {n === 7 ? '7+' : n}
              </button>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Complexity */}
      <div className="space-y-2.5">
        <SectionLabel icon={Gauge} label="Complexity" />
        <div className="flex gap-1">
          {COMPLEXITY_STEPS.map(({ value, label, activeClass }) => (
            <button
              key={value}
              onClick={() => handleComplexityClick(value)}
              title={COMPLEXITY_LABELS[value]}
              className={cn(
                'flex-1 rounded border py-1.5 text-xs font-medium transition-colors',
                isComplexityInRange(value)
                  ? activeClass
                  : 'border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {isComplexityFiltered && (
          <p className="text-xs text-muted-foreground">
            {COMPLEXITY_LABELS[filters.complexity_min]}
            {filters.complexity_min !== filters.complexity_max &&
              ` – ${COMPLEXITY_LABELS[filters.complexity_max]}`}
          </p>
        )}
      </div>

      <Separator />

      {/* Interaction */}
      <div className="space-y-2.5">
        <SectionLabel icon={Shuffle} label="Interaction" />
        <div className="flex flex-col gap-1.5">
          {INTERACTION_OPTIONS.map(({ value, label, emoji }) => {
            const selected = filters.interaction === value
            return (
              <button
                key={value}
                onClick={() => set({ interaction: selected ? '' : value })}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors text-left',
                  selected ? pillOn : pillOff
                )}
              >
                <span className="text-base leading-none">{emoji}</span>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Play Time */}
      <div className="space-y-2.5">
        <SectionLabel icon={Clock} label="Play Time" />
        <div className="flex flex-wrap gap-1.5">
          {TIME_PRESETS.map(({ label, value }) => {
            const selected = filters.play_time === value
            return (
              <button
                key={value}
                onClick={() => set({ play_time: selected ? null : value })}
                className={cn(pillBase, 'px-3 py-1.5', selected ? pillOn : pillOff)}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <Separator />

      {/* Rating */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <SectionLabel icon={Star} label="Min Rating" />
          <span className="text-xs font-medium text-amber-500">
            {filters.rating_min !== null ? `${filters.rating_min}+` : 'Any'}
          </span>
        </div>
        <Slider
          min={1}
          max={10}
          step={0.5}
          value={[filters.rating_min ?? 1]}
          onValueChange={([val]) => set({ rating_min: val === 1 ? null : val })}
          className="[&_[data-slot=slider-range]]:bg-amber-500 [&_[data-slot=slider-thumb]]:border-amber-500"
        />
      </div>

      <Separator />

      {/* Genres */}
      <div className="space-y-2.5">
        <SectionLabel icon={Tag} label="Genres" />
        {genres.length === 0 ? (
          <p className="text-xs text-muted-foreground">No genres yet</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {genres.map((genre) => {
              const selected = filters.genres.includes(genre)
              return (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={cn(pillBase, 'px-2.5 py-1 text-xs', selected ? pillOn : pillOff)}
                >
                  {genre}
                </button>
              )
            })}
          </div>
        )}
      </div>

    </aside>
  )
}
