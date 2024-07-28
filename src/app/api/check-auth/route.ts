import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  const authToken = cookies().get('authToken')?.value;

  if (!authToken) {
    console.log('No authToken found in /api/check-auth');
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    jwt.verify(authToken, process.env.JWT_SECRET!);
    console.log('Valid authToken found in /api/check-auth');
    return NextResponse.json({ authenticated: true }, { status: 200 });
  } catch (error) {
    console.log('Invalid authToken in /api/check-auth');
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}