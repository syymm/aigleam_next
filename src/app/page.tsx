'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from './components/LandingPage';

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/check-auth');
        if (response.ok) {
          // 有token，直接跳转到聊天页面
          router.replace('/hello');
          return;
        }
        // 没有token，显示落地页
        setIsAuthenticated(false);
      } catch (error) {
        // 认证失败，显示落地页
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [router]);

  // 如果还在检查认证状态，不显示任何内容（避免闪烁）
  if (isAuthenticated === null) {
    return null;
  }

  // 没有token，显示落地页
  return <LandingPage />;
}
