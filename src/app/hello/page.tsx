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
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/login');
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // 如果正在加载，显示聊天界面框架但带加载状态
  if (isLoading) {
    return (
      <ThemeProvider>
        <div className={styles.chatpage}>
          <div className={styles.loadingScreen}>正在验证身份...</div>
        </div>
      </ThemeProvider>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ThemeProvider>
      <div className={styles.chatpage}>
        <ChatPageComponent />
      </div>
    </ThemeProvider>
  );
}