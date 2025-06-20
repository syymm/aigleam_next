'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LandingPage from './components/LandingPage';

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/check-auth');
        if (response.ok) {
          setIsAuthenticated(true);
          router.push('/hello');
        }
      } catch (error) {
        // 认证失败，保持在落地页
      }
    };

    checkAuth();
  }, [router]);

  // 默认显示落地页，如果已登录会自动跳转
  return <LandingPage />;
}
