'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Camera, ImageIcon, Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  addGameFromBggAction,
  addGameFromPhotoAction,
  type PhotoAddResult,
} from '@/lib/actions/photo'
import type { BggSearchResult } from '@/lib/types/bgg'

const MAX_DIMENSION = 1600

type Step =
  | { kind: 'pick' }
  | { kind: 'working' }
  | { kind: 'choose'; guess: string; candidates: BggSearchResult[] }
  | { kind: 'error'; message: string; guess?: string }

interface PhotoAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Hand off to the BGG search dialog with this query */
  onSearchManually: (query: string) => void
}

/** Phone photos are several MB; Gemma doesn't need more than ~1600px */
async function downscale(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Failed to encode photo'))), 'image/jpeg', 0.85)
  )
}

export function PhotoAddDialog({ open, onOpenChange, onSearchManually }: PhotoAddDialogProps) {
  const router = useRouter()
  const cameraInput = useRef<HTMLInputElement>(null)
  const libraryInput = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState<Step>({ kind: 'pick' })
  const [preview, setPreview] = useState<string | null>(null)
  const [selectingId, setSelectingId] = useState<number | null>(null)

  function reset() {
    setStep({ kind: 'pick' })
    setSelectingId(null)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(null)
  }

  function handleOpenChange(next: boolean) {
    // Closing mid-identification would drop the result; the game may still be added
    if (!next && step.kind === 'working') return
    if (!next) reset()
    onOpenChange(next)
  }

  function searchManually(query: string) {
    reset()
    onSearchManually(query)
  }

  function handleResult(result: PhotoAddResult) {
    switch (result.status) {
      case 'added':
        reset()
        onOpenChange(false)
        router.push(`/games?game=${result.gameId}`)
        break
      case 'duplicate':
        setStep({ kind: 'error', message: `"${result.name}" is already in your collection.` })
        break
      case 'choose':
        setStep({ kind: 'choose', guess: result.guess, candidates: result.candidates })
        break
      case 'error':
        setStep({ kind: 'error', message: result.message, guess: result.guess })
        break
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setStep({ kind: 'working' })
    try {
      const photo = await downscale(file)
      setPreview(URL.createObjectURL(photo))
      const formData = new FormData()
      formData.append('photo', photo, 'photo.jpg')
      handleResult(await addGameFromPhotoAction(formData))
    } catch (err) {
      console.error('Photo add failed:', err)
      setStep({ kind: 'error', message: 'Something went wrong. Please try again.' })
    }
  }

  async function handleSelectCandidate(id: number) {
    setSelectingId(id)
    try {
      handleResult(await addGameFromBggAction(id))
    } catch {
      setStep({ kind: 'error', message: 'Network error. Please try again.' })
    } finally {
      setSelectingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Game from Photo</DialogTitle>
          <DialogDescription>
            Snap the front of the box. Gemma reads it and the game is added with details from BoardGameGeek.
          </DialogDescription>
        </DialogHeader>

        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
        />
        <input
          ref={libraryInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />

        {preview && step.kind !== 'pick' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Your photo" className="mx-auto max-h-56 rounded-md object-contain" />
        )}

        {step.kind === 'pick' && (
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={() => cameraInput.current?.click()}>
              <Camera className="mr-2 h-5 w-5" />
              Take photo
            </Button>
            <Button size="lg" variant="outline" onClick={() => libraryInput.current?.click()}>
              <ImageIcon className="mr-2 h-5 w-5" />
              Choose from library
            </Button>
          </div>
        )}

        {step.kind === 'working' && (
          <div className="flex flex-col items-center gap-2 py-4 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Identifying the game and adding it… this can take up to a minute.
            </p>
          </div>
        )}

        {step.kind === 'choose' && (
          <div className="space-y-3">
            <p className="text-sm">
              Gemma read <span className="font-medium">&ldquo;{step.guess}&rdquo;</span> but
              there&apos;s no exact match on BoardGameGeek. Which one is it?
            </p>
            <ul className="divide-y rounded-md border">
              {step.candidates.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 text-left text-sm hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={() => handleSelectCandidate(c.id)}
                    disabled={selectingId !== null}
                  >
                    <span className="truncate">
                      {c.name}
                      {c.year && <span className="text-muted-foreground ml-1">({c.year})</span>}
                    </span>
                    {selectingId === c.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="flex-1" onClick={reset} disabled={selectingId !== null}>
                Try another photo
              </Button>
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => searchManually(step.guess)}
                disabled={selectingId !== null}
              >
                Search manually
              </Button>
            </div>
          </div>
        )}

        {step.kind === 'error' && (
          <div className="space-y-3">
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{step.message}</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button className="flex-1" onClick={reset}>
                Try another photo
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => searchManually(step.guess ?? '')}>
                Search manually
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
