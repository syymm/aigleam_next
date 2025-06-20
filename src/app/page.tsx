'use client';

import LandingPage from './components/LandingPage';

export default function Home() {
  // 中间件已经处理了认证重定向，这里直接显示落地页
  return <LandingPage />;
}
