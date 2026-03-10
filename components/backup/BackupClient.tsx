'use client'

import { useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Upload, AlertTriangle } from 'lucide-react'

type Status = 'idle' | 'uploading' | 'success' | 'error'

export function BackupClient() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function handleImport() {
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setStatus('error')
      setMessage('Please select a backup ZIP file first.')
      return
    }

    const confirmed = window.confirm(
      'WARNING: Importing a backup will permanently delete all existing games and replace them with the backup data. This cannot be undone. Continue?'
    )
    if (!confirmed) return

    setStatus('uploading')
    setMessage('')

    try {
      const formData = new FormData()
      formData.append('backup', file)
      const res = await fetch('/api/backup', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) {
        setStatus('error')
        setMessage(json.error ?? 'Import failed')
      } else {
        setStatus('success')
        setMessage(
          `Restore complete — ${json.gamesRestored} games and ${json.filesRestored} files restored.`
        )
        // Reset file input
        if (fileRef.current) fileRef.current.value = ''
      }
    } catch {
      setStatus('error')
      setMessage('Network error during import.')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Export */}
      <section className="rounded-lg border p-6 flex flex-col gap-3">
        <h2 className="font-medium text-lg flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Backup
        </h2>
        <p className="text-sm text-muted-foreground">
          Download a ZIP archive containing your full game catalog (CSV) and all uploaded images
          and rulebooks.
        </p>
        <div>
          <a href="/api/backup" download>
            <Button variant="outline">Download Backup ZIP</Button>
          </a>
        </div>
      </section>

      {/* Import */}
      <section className="rounded-lg border border-destructive/40 p-6 flex flex-col gap-3">
        <h2 className="font-medium text-lg flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Restore from Backup
        </h2>
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 text-destructive p-3 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Restoring will <strong>permanently delete all current games</strong> and replace them
            with the backup data. This action cannot be undone.
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Select a <code className="text-xs bg-muted px-1 py-0.5 rounded">.zip</code> file
          previously exported from this application.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 items-start">
          <input
            ref={fileRef}
            type="file"
            accept=".zip"
            className="text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:text-sm file:bg-muted file:cursor-pointer cursor-pointer"
          />
          <Button
            variant="destructive"
            onClick={handleImport}
            disabled={status === 'uploading'}
            className="shrink-0"
          >
            {status === 'uploading' ? 'Restoring…' : 'Restore Backup'}
          </Button>
        </div>
        {message && (
          <p
            className={`text-sm ${status === 'success' ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}
          >
            {message}
          </p>
        )}
      </section>
    </div>
  )
}
