'use client'

import { useState } from 'react'
import { Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BggImportDialog } from '@/components/add-game/BggImportDialog'
import { PhotoAddDialog } from '@/components/add-game/PhotoAddDialog'

export function AddGameButton() {
  const [open, setOpen] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [initialQuery, setInitialQuery] = useState('')

  function openSearch(query: string) {
    setPhotoOpen(false)
    setInitialQuery(query)
    setOpen(true)
  }

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setPhotoOpen(true)}
          aria-label="Add game from photo"
          title="Add game from photo"
        >
          <Camera className="h-4 w-4" />
        </Button>
        <Button size="sm" onClick={() => openSearch('')}>
          + Add Game
        </Button>
      </div>
      <PhotoAddDialog open={photoOpen} onOpenChange={setPhotoOpen} onSearchManually={openSearch} />
      {/* Remount so a new initialQuery takes effect */}
      <BggImportDialog key={initialQuery} open={open} onOpenChange={setOpen} initialQuery={initialQuery} />
    </>
  )
}
