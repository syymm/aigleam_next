'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HelloPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
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
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!isAuthenticated) {
    return <div>Checking authentication...</div>;
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column' }}>
      <h1>Hello</h1>
      <p>Current time: {currentTime}</p>
    </div>
  );
}
