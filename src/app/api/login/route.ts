import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/auth.service';
import { validateLoginInput, ValidationError, sanitizeInput } from '@/lib/utils/validation';
import { LoginRequest, LoginResponse, AuthError } from '@/lib/types/auth';
import { handleApiError, logError } from '@/lib/utils/error-handler';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse and validate request body
    const body: LoginRequest = await req.json();
    
    // Sanitize input
    const sanitizedData: LoginRequest = {
      username: sanitizeInput(body.username),
      password: body.password,
      rememberMe: body.rememberMe || false,
    };

    // Validate input
    validateLoginInput(sanitizedData);

    // Authenticate user
    const user = await AuthService.authenticateUser(sanitizedData);

    // Generate token
    const token = AuthService.generateToken(user, sanitizedData.rememberMe);

    // Set auth cookie
    AuthService.setAuthCookie(token, sanitizedData.rememberMe);

    // Prepare response
    const response: LoginResponse = {
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
      },
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    logError(error, 'POST /api/login');
    return handleApiError(error);
  }
}
