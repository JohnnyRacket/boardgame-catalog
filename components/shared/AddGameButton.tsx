'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BggImportDialog } from '@/components/add-game/BggImportDialog'

export function AddGameButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        + Add Game
      </Button>
      <BggImportDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
