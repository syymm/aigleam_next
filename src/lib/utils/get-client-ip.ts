import { NextRequest } from 'next/server';

export function getClientIP(request: NextRequest): string {
  // 尝试多个header获取真实IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || '127.0.0.1';
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (clientIP) {
    return clientIP;
  }
  
  // 开发环境fallback
  return request.ip || '127.0.0.1';
}