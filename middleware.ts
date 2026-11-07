import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // HttpOnly auth cookies are set on this origin via the /api proxy.
  const isLoggedIn = Boolean(
    request.cookies.get('accessToken')?.value ||
      request.cookies.get('refreshToken')?.value
  )
  const { pathname } = request.nextUrl

  const protectedRoutes = ['/', '/dashboard', '/profile']
  const authRoutes = ['/login']

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthRoute = authRoutes.includes(pathname)

  // If not logged in and hitting a protected route (but not /login itself), redirect to /login
  if (!isLoggedIn && isProtectedRoute && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If logged in and on "/" or "/login", send user to dashboard
  if (isLoggedIn && (pathname === '/' || isAuthRoute)) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}
 
export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/profile/:path*',
    '/login',
  ],
}
