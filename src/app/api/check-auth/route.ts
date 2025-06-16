import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';

interface AuthCheckResponse {
  authenticated: boolean;
  user?: {
    id: number;
    username: string;
  };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await AuthService.getCurrentUser();

    if (!user) {
      const response: AuthCheckResponse = { authenticated: false };
      return NextResponse.json(response, { status: 401 });
    }

    const response: AuthCheckResponse = {
      authenticated: true,
      user: {
        id: user.id,
        username: user.username,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Auth check error:', error);
    }

    const response: AuthCheckResponse = { authenticated: false };
    return NextResponse.json(response, { status: 401 });
  }
}