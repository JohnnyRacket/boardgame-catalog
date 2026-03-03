'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface ImageUploadFieldProps {
  name?: string
  initialUrl?: string
}

export function ImageUploadField({ name = 'image_url', initialUrl }: ImageUploadFieldProps) {
  const [preview, setPreview] = useState<string | null>(initialUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string>(initialUrl ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setUploading(true)
    setPreview(URL.createObjectURL(file))

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Upload failed')
        setPreview(null)
        setUploadedUrl('')
      } else {
        setUploadedUrl(data.url)
      }
    } catch {
      setError('Upload failed. Please try again.')
      setPreview(null)
      setUploadedUrl('')
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    setPreview(null)
    setUploadedUrl('')
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <Label>Cover Image</Label>

      {preview ? (
        <div className="relative w-40 overflow-hidden rounded-md border">
          <div className="aspect-[4/3]">
            <Image src={preview} alt="Preview" fill className="object-cover" />
          </div>
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute right-1 top-1 h-6 w-6"
            onClick={handleRemove}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor="image-file-input"
          className="flex h-32 w-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
        >
          <Upload className="h-5 w-5" />
          {uploading ? 'Uploading…' : 'Upload image'}
          <input
            id="image-file-input"
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Hidden field carries the uploaded URL into the form */}
      <input type="hidden" name={name} value={uploadedUrl} />
    </div>
  )
}
