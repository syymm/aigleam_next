import { LoginRequest } from '@/lib/types/auth';

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const validateLoginInput = (data: LoginRequest): void => {
  if (!data.username || typeof data.username !== 'string') {
    throw new ValidationError('Username is required', 'username');
  }

  if (!data.password || typeof data.password !== 'string') {
    throw new ValidationError('Password is required', 'password');
  }

  if (data.username.trim().length === 0) {
    throw new ValidationError('Username cannot be empty', 'username');
  }

  if (data.password.trim().length === 0) {
    throw new ValidationError('Password cannot be empty', 'password');
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.username)) {
    throw new ValidationError('Invalid email format', 'username');
  }

  if (data.password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters long', 'password');
  }
};

export const sanitizeInput = (input: string): string => {
  return input.trim().toLowerCase();
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: '密码不能为空' };
  }

  if (password.trim().length === 0) {
    return { isValid: false, message: '密码不能为空' };
  }

  if (password.length < 6) {
    return { isValid: false, message: '密码长度至少需要6位' };
  }

  return { isValid: true };
};