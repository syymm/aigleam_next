import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  console.log('Middleware executing for path:', request.nextUrl.pathname);

  const authToken = request.cookies.get('authToken')?.value

  if (!authToken && request.nextUrl.pathname.startsWith('/hello')) {
    console.log('No authToken found, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url))
  }

  console.log('Middleware allowing request to continue');
  return NextResponse.next()
}

export const config = {
  matcher: ['/hello', '/hello/:path*']
}