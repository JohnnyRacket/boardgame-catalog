import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { createSessionCookieOptions } from '@/lib/auth'

const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000

const failedAttempts = new Map<string, { count: number; resetAt: number }>()

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = failedAttempts.get(ip)
  if (!entry || now > entry.resetAt) return false
  return entry.count >= RATE_LIMIT_MAX
}

function recordFailure(ip: string): void {
  const now = Date.now()
  const entry = failedAttempts.get(ip)
  if (!entry || now > entry.resetAt) {
    failedAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
  } else {
    entry.count++
  }
}

function resetFailures(ip: string): void {
  failedAttempts.delete(ip)
}

function passwordMatches(candidate: string): boolean {
  const expected = process.env.AUTH_TOKEN ?? 'password'
  try {
    return timingSafeEqual(Buffer.from(candidate, 'utf8'), Buffer.from(expected, 'utf8'))
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)

  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many failed attempts' }, { status: 429 })
  }

  let body: { password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (typeof body.password !== 'string' || !passwordMatches(body.password)) {
    recordFailure(ip)
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  resetFailures(ip)
  const response = NextResponse.json({ ok: true })
  response.cookies.set(await createSessionCookieOptions())
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set({ name: 'auth_token', value: '', maxAge: 0, path: '/' })
  return response
}
