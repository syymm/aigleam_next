export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface ApiError {
  error: string;
  code?: string;
  field?: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestConfig {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
}

// 注册相关类型
export interface RegisterRequest {
  username: string;
  verificationCode: string;
  password: string;
}

export interface RegisterResponse {
  message: string;
  userId: number;
}

// 验证码相关类型
export interface VerificationCodeRequest {
  username: string;
}

export interface VerificationCodeResponse {
  message: string;
  waitTime?: number;
}

// 速率限制响应类型
export interface RateLimitResponse {
  message: string;
  waitTime: number;
  allowed: boolean;
}

// 前端表单状态类型
export interface FormState {
  isLoading: boolean;
  error: string | null;
  success: string | null;
}

// 通知类型
export interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}