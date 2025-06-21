import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('authToken')?.value
  const pathname = request.nextUrl.pathname

  // 保护 /hello 路由，没有token重定向到根目录
  if (!authToken && pathname.startsWith('/hello')) {
    const redirectUrl = new URL('/', request.url)
    const response = NextResponse.redirect(redirectUrl)
    // 添加缓存控制头，避免开发模式下的缓存问题
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    return response
  }

  // 如果访问根目录且有token，重定向到聊天页面
  if (authToken && pathname === '/') {
    const redirectUrl = new URL('/hello', request.url)
    const response = NextResponse.redirect(redirectUrl)
    // 添加缓存控制头，避免开发模式下的缓存问题
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/hello', '/hello/:path*']
}