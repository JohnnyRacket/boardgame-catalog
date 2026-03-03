'use client'

import { useState } from 'react'
import { ArrowLeft } from 'lucide-react'
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
import type { BggGameData } from '@/lib/types/bgg'

type Step =
  | { kind: 'url' }
  | { kind: 'form'; data?: BggGameData; genres: string[] }

interface BggImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BggImportDialog({ open, onOpenChange }: BggImportDialogProps) {
  const [step, setStep] = useState<Step>({ kind: 'url' })
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [manualLoading, setManualLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    if (!next) {
      // Reset to url step on close
      setStep({ kind: 'url' })
      setUrl('')
      setError(null)
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

  async function handleImport(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const [bggRes, genresRes] = await Promise.all([
        fetch('/api/bgg', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        }),
        fetch('/api/genres'),
      ])

      const bggData = await bggRes.json()
      if (!bggRes.ok) {
        setError(bggData.error ?? 'Failed to import game data')
        return
      }

      const genresData = await genresRes.json()
      const genres: string[] = genresData.genres ?? []

      setStep({ kind: 'form', data: bggData as BggGameData, genres })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
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
            {step.kind === 'url' ? 'Import from BoardGameGeek' : 'Add Game'}
          </DialogTitle>
        </DialogHeader>

        {step.kind === 'url' ? (
          <form onSubmit={handleImport} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="bgg-url">BoardGameGeek URL</Label>
              <Input
                id="bgg-url"
                type="url"
                placeholder="https://boardgamegeek.com/boardgame/13/catan"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <Button type="submit" disabled={loading || manualLoading} className="w-full sm:w-auto">
                {loading ? 'Importing…' : 'Import'}
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
        ) : (
          <div className="space-y-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="-ml-2 text-muted-foreground"
              onClick={() => {
                setStep({ kind: 'url' })
                setError(null)
              }}
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Back to URL input
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
