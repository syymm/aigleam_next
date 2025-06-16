import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: number;
  username: string;
}

export async function getCurrentUserId(): Promise<number | null> {
  const authToken = cookies().get('authToken')?.value;

  if (!authToken) {
    return null;
  }

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as JWTPayload;
    return decoded.userId;
  } catch (error) {
    return null;
  }
}