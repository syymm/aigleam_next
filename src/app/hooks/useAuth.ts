import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LoginRequest } from '@/lib/types/auth';

interface UseAuthReturn {
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<boolean>;
  clearError: () => void;
}

interface LoginErrorResponse {
  error: string;
  code?: string;
}

export const useAuth = (): UseAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const login = useCallback(async (credentials: LoginRequest): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        // 登录成功后立即跳转，避免等待不必要的检查
        router.push('/hello');
        return true;
      } else {
        const errorData = data as LoginErrorResponse;
        
        // Map server errors to user-friendly messages
        const errorMessages: Record<string, string> = {
          'User not found': '用户不存在',
          'Invalid password': '密码错误',
          'Username is required': '请输入邮箱地址',
          'Password is required': '请输入密码',
          'Username cannot be empty': '邮箱地址不能为空',
          'Password cannot be empty': '密码不能为空',
          'Invalid email format': '邮箱格式不正确',
          'Password must be at least 6 characters long': '密码至少需要6位字符',
          'Authentication failed': '登录失败，请检查用户名和密码',
          'Database operation failed': '服务器错误，请稍后重试',
          'Internal server error': '服务器内部错误，请稍后重试',
        };

        const errorMessage = errorMessages[errorData.error] || errorData.error || '登录失败';
        setError(errorMessage);
        return false;
      }
    } catch (networkError) {
      console.error('Login network error:', networkError);
      setError('网络错误，请稍后重试');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    login,
    clearError,
  };
};