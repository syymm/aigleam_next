import { User } from './user';
import { ApiError } from './api';

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  message: string;
  user?: {
    id: number;
    username: string;
  };
  token?: string; // Optional: if you want to return token in response
}

export interface AuthError extends ApiError {
  field?: 'username' | 'password' | 'general';
}

export interface JWTPayload {
  userId: number;
  username: string;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: number;
  username: string;
  password: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface VerificationRequest {
  email: string;
  code: string;
}