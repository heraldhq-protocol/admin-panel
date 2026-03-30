import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isAuthPage = req.nextUrl.pathname.startsWith('/login')
  const isPublicAsset =
    req.nextUrl.pathname.startsWith('/_next') ||
    req.nextUrl.pathname.startsWith('/api/auth') ||
    req.nextUrl.pathname === '/favicon.ico'

  if (isPublicAsset) return NextResponse.next()

  if (!req.auth && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (req.auth && isAuthPage) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
