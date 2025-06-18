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
        setIsAuthenticated(response.ok);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // 如果已登录，跳转到聊天页面
  useEffect(() => {
    if (isAuthenticated === true) {
      router.push('/hello');
    }
  }, [isAuthenticated, router]);

  // 显示加载状态
  if (isAuthenticated === null) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        正在加载...
      </div>
    );
  }

  // 未登录显示落地页
  if (isAuthenticated === false) {
    return <LandingPage />;
  }

  return null;
}
