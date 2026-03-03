'use client'

import { useState } from 'react'
import { X, ChevronsUpDown, Plus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

interface GenreTagInputProps {
  genres: string[]
  initialSelected?: string[]
}

export function GenreTagInput({ genres, initialSelected }: GenreTagInputProps) {
  const [selected, setSelected] = useState<string[]>(initialSelected ?? [])
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')

  function select(genre: string) {
    if (!selected.includes(genre)) {
      setSelected((prev) => [...prev, genre])
    }
    setInputValue('')
    setOpen(false)
  }

  function remove(genre: string) {
    setSelected((prev) => prev.filter((g) => g !== genre))
  }

  const trimmed = inputValue.trim()
  const filtered = genres.filter(
    (g) =>
      g.toLowerCase().includes(trimmed.toLowerCase()) && !selected.includes(g)
  )
  const canAdd =
    trimmed.length > 0 &&
    !genres.some((g) => g.toLowerCase() === trimmed.toLowerCase()) &&
    !selected.some((g) => g.toLowerCase() === trimmed.toLowerCase())

  return (
    <div className="space-y-3">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((genre) => (
            <Badge
              key={genre}
              variant="secondary"
              className="cursor-pointer gap-1 pr-1"
              onClick={() => remove(genre)}
            >
              {genre}
              <X className="h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            <span className="text-muted-foreground">Search or add a genre…</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search genres…"
              value={inputValue}
              onValueChange={setInputValue}
            />
            <CommandList>
              {filtered.length === 0 && !canAdd && (
                <CommandEmpty>No genres found.</CommandEmpty>
              )}
              {filtered.length > 0 && (
                <CommandGroup>
                  {filtered.map((genre) => (
                    <CommandItem key={genre} value={genre} onSelect={() => select(genre)}>
                      {genre}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              {canAdd && (
                <CommandGroup>
                  <CommandItem value={`__add__${trimmed}`} onSelect={() => select(trimmed)}>
                    <Plus className="h-4 w-4" />
                    Add &ldquo;{trimmed}&rdquo;
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Carries selected genres as comma-separated value */}
      <input type="hidden" name="genres_hidden" value={selected.join(',')} />
    </div>
  )
}
