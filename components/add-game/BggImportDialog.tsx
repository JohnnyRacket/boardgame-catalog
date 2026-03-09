'use client'

import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AddGameForm } from './AddGameForm'
import type { BggGameData, BggSearchResult } from '@/lib/types/bgg'
import { checkDuplicateNamesAction } from '@/lib/actions/games'

type Step =
  | { kind: 'search' }
  | { kind: 'results'; results: BggSearchResult[] }
  | { kind: 'form'; data?: BggGameData; genres: string[] }

interface BggImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BggImportDialog({ open, onOpenChange }: BggImportDialogProps) {
  const [step, setStep] = useState<Step>({ kind: 'search' })
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BggSearchResult[]>([])
  const [selectingId, setSelectingId] = useState<number | null>(null)
  const [duplicateNames, setDuplicateNames] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [manualLoading, setManualLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next) {
      setStep({ kind: 'search' })
      setQuery('')
      setResults([])
      setSelectingId(null)
      setError(null)
      setDuplicateNames(new Set())
    }
    onOpenChange(next)
  }

  async function handleManualEntry() {
    setManualLoading(true)
    try {
      const genresRes = await fetch('/api/genres')
      const genresData = await genresRes.json()
      const genres: string[] = genresData.genres ?? []
      setStep({ kind: 'form', genres })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setManualLoading(false)
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) {
      setError('Please enter a game name to search.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/bgg?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Search failed. Please try again.')
        return
      }
      const searchResults: BggSearchResult[] = data
      setResults(searchResults)
      setStep({ kind: 'results', results: searchResults })
      const found = await checkDuplicateNamesAction(searchResults.map((r) => r.name))
      setDuplicateNames(new Set(found))
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSelectResult(id: number) {
    setSelectingId(id)
    setError(null)
    try {
      const [bggRes, genresRes] = await Promise.all([
        fetch('/api/bgg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        }),
        fetch('/api/genres'),
      ])

      const bggData = await bggRes.json()
      if (!bggRes.ok) {
        setError(bggData.error ?? 'Failed to fetch game details.')
        return
      }

      const genresData = await genresRes.json()
      const genres: string[] = genresData.genres ?? []

      setStep({ kind: 'form', data: bggData as BggGameData, genres })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setSelectingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          if (step.kind === 'form') e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {step.kind === 'form' ? 'Add Game' : 'Import from BoardGameGeek'}
          </DialogTitle>
        </DialogHeader>

        {step.kind === 'search' && (
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bgg-search">Game name</Label>
              <Input
                id="bgg-search"
                type="text"
                placeholder="Search for a game…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Button type="submit" disabled={loading || manualLoading} className="w-full sm:w-auto">
                {loading ? 'Searching…' : 'Search'}
              </Button>
              <span className="text-sm text-muted-foreground text-center sm:text-left">or</span>
              <Button
                type="button"
                variant="outline"
                disabled={loading || manualLoading}
                className="w-full sm:w-auto"
                onClick={handleManualEntry}
              >
                {manualLoading ? 'Loading…' : 'Enter manually'}
              </Button>
            </div>
          </form>
        )}

        {step.kind === 'results' && (
          <div className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 text-muted-foreground"
              onClick={() => {
                setStep({ kind: 'search' })
                setError(null)
              }}
              disabled={selectingId !== null}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to search
            </Button>

            {error && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            {step.results.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No results found. Try a different search term.
              </p>
            ) : (
              <ul className="divide-y rounded-md border">
                {step.results.map((result) => (
                  <li key={result.id}>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-4 py-3 text-left text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleSelectResult(result.id)}
                      disabled={selectingId !== null}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <span className="truncate">
                          {result.name}
                          {result.year && (
                            <span className="text-muted-foreground ml-1">({result.year})</span>
                          )}
                        </span>
                        {duplicateNames.has(result.name.toLowerCase()) && (
                          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 font-medium dark:bg-amber-950 dark:text-amber-400">
                            Already in collection
                          </span>
                        )}
                      </span>
                      {selectingId === result.id && (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {step.kind === 'form' && (
          <div className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 text-muted-foreground"
              onClick={() => {
                setStep({ kind: 'results', results })
                setError(null)
              }}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to search results
            </Button>
            <AddGameForm
              genres={step.genres}
              defaultValues={step.data}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
