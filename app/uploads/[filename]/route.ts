import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params

  // Prevent path traversal
  if (filename.includes('..') || filename.includes('/')) {
    return new NextResponse('Not found', { status: 404 })
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
  const filePath = path.join(uploadsDir, filename)

  try {
    const buffer = await readFile(filePath)
    const ext = filename.split('.').pop()?.toLowerCase() ?? ''
    const contentType = MIME_TYPES[ext] ?? 'application/octet-stream'

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new NextResponse('Not found', { status: 404 })
  }
}
