'use client';

import React from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';
import ChatPageComponent from './ChatPageComponent';
import styles from './styles/ChatPage.module.css';

export default function ChatPage() {
  // 中间件已经处理了认证检查，这里直接渲染聊天页面
  return (
    <ThemeProvider>
      <div className={styles.chatpage}>
        <ChatPageComponent />
      </div>
    </ThemeProvider>
  );
}