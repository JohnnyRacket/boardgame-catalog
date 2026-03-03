'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface RulebookUploadFieldProps {
  initialUrl?: string
}

function filenameFromUrl(url: string): string {
  return url.split('/').pop() ?? url
}

export function RulebookUploadField({ initialUrl }: RulebookUploadFieldProps) {
  const [uploadedUrl, setUploadedUrl] = useState<string>(initialUrl ?? '')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/uploads/rulebook', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Upload failed')
        setUploadedUrl('')
      } else {
        setUploadedUrl(data.url)
      }
    } catch {
      setError('Upload failed. Please try again.')
      setUploadedUrl('')
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    setUploadedUrl('')
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <Label>Rulebook (PDF)</Label>

      {uploadedUrl ? (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 w-fit max-w-sm">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="text-sm truncate text-muted-foreground">
            {filenameFromUrl(uploadedUrl)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0 ml-1"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor="rulebook-file-input"
          className="flex h-32 w-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          <Upload className="h-5 w-5" />
          {uploading ? 'Uploading…' : 'Upload PDF'}
          <input
            id="rulebook-file-input"
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <input type="hidden" name="rulebook_url" value={uploadedUrl} />
    </div>
  )
}
