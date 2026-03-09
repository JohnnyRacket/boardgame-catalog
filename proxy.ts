import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticatedFromRequest } from '@/lib/auth'

export async function proxy(req: NextRequest) {
  if (!(await isAuthenticatedFromRequest(req))) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', req.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/add', '/games/:id*/edit'],
}
