import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { LoginRequest, JWTPayload, AuthUser } from '@/lib/types/auth';
import { ValidationError } from '@/lib/utils/validation';
import { AuthError, NotFoundError, logError } from '@/lib/utils/error-handler';

export class AuthService {
  private static readonly JWT_SECRET = process.env.JWT_SECRET!;
  private static readonly COOKIE_NAME = 'authToken';

  static async authenticateUser(credentials: LoginRequest): Promise<AuthUser> {
    try {
      const { username, password } = credentials;

      // Find user by username (email)
      const user = await prisma.user.findUnique({
        where: { username: username.toLowerCase() },
      });

      if (!user) {
        throw new AuthError('User not found', 'USER_NOT_FOUND');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        throw new AuthError('Invalid password', 'INVALID_PASSWORD');
      }

      return user;
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      
      logError(error, 'AuthService.authenticateUser');
      throw new AuthError('Authentication failed');
    }
  }

  static generateToken(user: AuthUser, rememberMe: boolean = false): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      username: user.username,
    };

    const expiresIn = rememberMe ? '7d' : '24h';
    
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn });
  }

  static setAuthCookie(token: string, rememberMe: boolean = false): void {
    const maxAge = rememberMe ? 7 * 24 * 60 * 60 : 24 * 60 * 60; // seconds

    cookies().set(this.COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/',
    });
  }

  static verifyToken(token: string): JWTPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as JWTPayload;
    } catch (error) {
      logError(error, 'AuthService.verifyToken');
      throw new AuthError('Invalid token', 'INVALID_TOKEN');
    }
  }

  static getAuthToken(): string | null {
    return cookies().get(this.COOKIE_NAME)?.value || null;
  }

  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        return null;
      }

      const payload = this.verifyToken(token);
      
      // 性能优化：对于认证检查，直接使用token中的信息
      // 避免不必要的数据库查询
      return {
        id: payload.userId,
        username: payload.username,
        password: '', // 不需要密码字段用于认证检查
      };
    } catch (error) {
      logError(error, 'AuthService.getCurrentUser');
      return null;
    }
  }

  // 添加一个需要完整用户信息时才查询数据库的方法
  static async getCurrentUserFromDB(): Promise<AuthUser | null> {
    try {
      const token = this.getAuthToken();
      
      if (!token) {
        return null;
      }

      const payload = this.verifyToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          username: true,
          password: true,
        },
      });

      return user;
    } catch (error) {
      logError(error, 'AuthService.getCurrentUserFromDB');
      return null;
    }
  }

  static clearAuthCookie(): void {
    cookies().set(this.COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/',
    });
  }
}