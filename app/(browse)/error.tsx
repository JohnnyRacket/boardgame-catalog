'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function BrowseError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const isDbError =
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('connect') ||
    (error as { code?: string }).code === 'ECONNREFUSED'

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="text-4xl">⚠️</div>
      <h2 className="text-xl font-semibold">
        {isDbError ? 'Database unavailable' : 'Something went wrong'}
      </h2>
      <p className="text-muted-foreground max-w-sm">
        {isDbError
          ? 'Could not connect to the database. Make sure it is running and try again.'
          : 'An unexpected error occurred. Please try again.'}
      </p>
      <Button onClick={reset} variant="outline">
        Try again
      </Button>
    </div>
  )
}
