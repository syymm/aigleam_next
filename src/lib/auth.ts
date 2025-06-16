import { AuthService } from '@/lib/services/auth.service';
import { JWTPayload } from '@/lib/types/auth';

export async function getCurrentUserId(): Promise<number | null> {
  try {
    const user = await AuthService.getCurrentUser();
    return user?.id || null;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser() {
  return AuthService.getCurrentUser();
}

export function verifyToken(token: string): JWTPayload {
  return AuthService.verifyToken(token);
}

export function getAuthToken(): string | null {
  return AuthService.getAuthToken();
}