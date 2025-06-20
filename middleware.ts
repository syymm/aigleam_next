import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('authToken')?.value

  // 保护 /hello 路由，没有token重定向到根目录
  if (!authToken && request.nextUrl.pathname.startsWith('/hello')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 如果访问根目录且有token，重定向到聊天页面
  if (authToken && request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/hello', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/hello', '/hello/:path*']
}