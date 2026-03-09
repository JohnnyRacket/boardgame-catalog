import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { isAuthenticatedFromRequest } from '@/lib/auth'

const ALLOWED_TYPES = ['application/pdf']
const MAX_SIZE = 20 * 1024 * 1024 // 20MB

export async function POST(request: NextRequest) {
  if (!isAuthenticatedFromRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Invalid file type. Only PDF files are allowed.' },
      { status: 400 }
    )
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File too large. Maximum size is 20MB' },
      { status: 400 }
    )
  }

  const filename = `${randomUUID()}.pdf`
  const uploadsDir = path.join(process.cwd(), 'public', 'uploads')

  try {
    await mkdir(uploadsDir, { recursive: true })
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(path.join(uploadsDir, filename), buffer)
    return NextResponse.json({ url: `/uploads/${filename}` })
  } catch (err) {
    console.error('Upload failed:', err)
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 })
  }
}
