import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

const COOKIE_NAME = 'auth_token'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90
const SESSION_PAYLOAD = 'authenticated'
const DEV_SESSION_SECRET = 'dev-only-insecure-secret-do-not-use-in-production'

function getSessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET env var is required in production')
    }
    console.warn('[auth] SESSION_SECRET not set — using insecure dev default')
    return DEV_SESSION_SECRET
  }
  return secret
}

async function getHmacKey(): Promise<CryptoKey> {
  const keyMaterial = new TextEncoder().encode(getSessionSecret())
  return crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  )
}

async function signSession(): Promise<string> {
  const key = await getHmacKey()
  const data = new TextEncoder().encode(SESSION_PAYLOAD)
  const sig = await crypto.subtle.sign('HMAC', key, data)
  const sigHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${SESSION_PAYLOAD}.${sigHex}`
}

async function verifySession(token: string): Promise<boolean> {
  const dotIndex = token.indexOf('.')
  if (dotIndex === -1 || token.slice(0, dotIndex) !== SESSION_PAYLOAD) return false
  const sigHex = token.slice(dotIndex + 1)
  if (sigHex.length !== 64) return false
  try {
    const key = await getHmacKey()
    const data = new TextEncoder().encode(SESSION_PAYLOAD)
    const sigBytes = new Uint8Array(sigHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
    return await crypto.subtle.verify('HMAC', key, sigBytes, data)
  } catch {
    return false
  }
}

// For middleware + API route handlers (sync NextRequest.cookies)
export async function isAuthenticatedFromRequest(req: NextRequest): Promise<boolean> {
  const value = req.cookies.get(COOKIE_NAME)?.value ?? ''
  return verifySession(value)
}

// For server actions + server components (async next/headers cookies())
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const value = cookieStore.get(COOKIE_NAME)?.value ?? ''
  return verifySession(value)
}

export async function createSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: await signSession(),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  }
}
