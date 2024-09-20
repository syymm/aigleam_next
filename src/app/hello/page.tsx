'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from '../contexts/ThemeContext';
import ChatPageComponent from './ChatPageComponent';
import styles from './styles/ChatPage.module.css';

export default function ChatPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/check-auth');
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return <div className={styles.loadingScreen}>正在加载...</div>;
  }

  if (!isAuthenticated) {
    return null; // 或者可以返回一个加载指示器
  }

  return (
    <ThemeProvider>
      <div className={styles.chatpage}>
        <ChatPageComponent />
      </div>
    </ThemeProvider>
  );
}