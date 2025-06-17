'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      try {
        const response = await fetch('/api/check-auth');
        if (response.ok) {
          // 用户已登录，跳转到聊天页面
          router.push('/hello');
        } else {
          // 用户未登录，跳转到登录页面
          router.push('/login');
        }
      } catch (error) {
        // 出错时默认跳转到登录页面
        router.push('/login');
      }
    };

    checkAuthAndRedirect();
  }, [router]);

  // 显示加载状态，避免看到空白页面
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px',
      color: '#666'
    }}>
      正在跳转...
    </div>
  );
}
