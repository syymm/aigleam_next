import { NextResponse } from 'next/server';
import { ValidationError } from './validation';

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public field?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 401, code);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Validation errors
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        code: 'VALIDATION_ERROR',
        field: error.field,
      },
      { status: 400 }
    );
  }

  // Auth errors
  if (error instanceof AuthError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code || 'AUTH_ERROR',
      },
      { status: error.statusCode }
    );
  }

  // App errors
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code || 'APP_ERROR',
      },
      { status: error.statusCode }
    );
  }

  // Database errors
  if (error instanceof Error && error.message.includes('Prisma')) {
    return NextResponse.json(
      {
        error: 'Database operation failed',
        code: 'DATABASE_ERROR',
      },
      { status: 500 }
    );
  }

  // Generic errors
  return NextResponse.json(
    {
      error: process.env.NODE_ENV === 'development' 
        ? (error as Error).message 
        : 'Internal server error',
      code: 'INTERNAL_ERROR',
    },
    { status: 500 }
  );
}

export function logError(error: unknown, context?: string): void {
  const timestamp = new Date().toISOString();
  const contextStr = context ? `[${context}] ` : '';
  
  if (process.env.NODE_ENV === 'development') {
    console.error(`${timestamp} ${contextStr}Error:`, error);
  } else {
    // In production, you might want to send to a logging service
    console.error(`${timestamp} ${contextStr}Error occurred`);
  }
}