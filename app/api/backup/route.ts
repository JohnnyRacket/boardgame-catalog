import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedFromRequest } from '@/lib/auth'
import { getAllGames, deleteAllGames, insertGame, upsertGenres } from '@/lib/db/queries'
import { gamesToCsv, csvToRawRows } from '@/lib/backup/csv'
import { importRowSchema } from '@/lib/backup/importSchema'
import { mkdir, readFile, writeFile } from 'fs/promises'
import path from 'path'
import archiver from 'archiver'
import unzipper from 'unzipper'
import { PassThrough } from 'stream'

const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

// ── GET /api/backup ──────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  if (!(await isAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const games = await getAllGames()
    const csv = gamesToCsv(games)
    const dateStr = new Date().toISOString().slice(0, 10)
    const zipName = `boardgame-catalog-backup-${dateStr}.zip`

    // Collect /uploads files referenced by games
    const referencedFiles = new Set<string>()
    for (const g of games) {
      if (g.image_url?.startsWith('/uploads/')) referencedFiles.add(path.basename(g.image_url))
      if (g.rulebook_url?.startsWith('/uploads/'))
        referencedFiles.add(path.basename(g.rulebook_url))
    }

    const passThrough = new PassThrough()
    const archive = archiver('zip', { zlib: { level: 6 } })

    archive.on('warning', (err) => {
      if (err.code !== 'ENOENT') throw err
    })
    archive.on('error', (err) => {
      throw err
    })

    archive.pipe(passThrough)
    archive.append(csv, { name: 'games.csv' })

    for (const filename of referencedFiles) {
      const filePath = path.join(UPLOADS_DIR, filename)
      try {
        const buf = await readFile(filePath)
        archive.append(buf, { name: `files/${filename}` })
      } catch {
        console.warn(`[backup] File not found on disk, skipping: ${filename}`)
      }
    }

    archive.finalize()

    const readable = new ReadableStream({
      start(controller) {
        passThrough.on('data', (chunk: Buffer) => controller.enqueue(chunk))
        passThrough.on('end', () => controller.close())
        passThrough.on('error', (err: Error) => controller.error(err))
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipName}"`,
      },
    })
  } catch (err) {
    console.error('[backup] Export failed:', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

// ── POST /api/backup ─────────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  if (!(await isAuthenticatedFromRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('backup')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No backup file provided' }, { status: 400 })
    }
    if (!file.name.endsWith('.zip')) {
      return NextResponse.json({ error: 'File must be a .zip archive' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buf = Buffer.from(bytes)
    const directory = await unzipper.Open.buffer(buf)

    // Parse games.csv
    const csvEntry = directory.files.find((f) => f.path === 'games.csv')
    if (!csvEntry) {
      return NextResponse.json({ error: 'games.csv not found in archive' }, { status: 400 })
    }
    const csvText = (await csvEntry.buffer()).toString('utf-8')
    const rawRows = csvToRawRows(csvText)

    // Validate all rows before touching the DB
    const errors: { row: number; issues: unknown }[] = []
    const parsed = rawRows.map((row, i) => {
      const result = importRowSchema.safeParse(row)
      if (!result.success) {
        errors.push({ row: i + 2, issues: result.error.flatten().fieldErrors })
        return null
      }
      return result.data
    })

    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed for some rows', details: errors },
        { status: 422 }
      )
    }

    // Restore files
    await mkdir(UPLOADS_DIR, { recursive: true })
    const fileEntries = directory.files.filter(
      (f) => f.path.startsWith('files/') && !f.path.endsWith('/')
    )
    for (const entry of fileEntries) {
      const filename = path.basename(entry.path)
      const content = await entry.buffer()
      await writeFile(path.join(UPLOADS_DIR, filename), content)
    }

    // Restore DB (destructive clear-then-insert)
    await deleteAllGames()

    let inserted = 0
    for (const row of parsed) {
      if (!row) continue
      const { genres, ...rest } = row
      const genresValue = genres && genres.length > 0 ? genres : null
      await insertGame({ ...rest, genres: genresValue })
      if (genres && genres.length > 0) await upsertGenres(genres)
      inserted++
    }

    return NextResponse.json({
      success: true,
      gamesRestored: inserted,
      filesRestored: fileEntries.length,
    })
  } catch (err) {
    console.error('[backup] Import failed:', err)
    return NextResponse.json({ error: 'Import failed' }, { status: 500 })
  }
}
