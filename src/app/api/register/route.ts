import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verificationCodeManager } from '../../utils/verificationCode';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  console.log('Received a POST request to /api/register');
  
  try {
    const { username, verificationCode, password } = await request.json();

    console.log(`Received registration request for username: ${username}`);

    if (!username || !verificationCode || !password) {
      console.log('Error: Missing required fields');
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    // 验证验证码
    console.log(`Attempting to verify code: ${verificationCode} for user: ${username}`);
    const isCodeValid = verificationCodeManager.verifyCode(username, verificationCode);
    console.log(`Verification code valid: ${isCodeValid}`);

    if (!isCodeValid) {
      console.log(`Error: Invalid or expired verification code for user: ${username}`);
      return NextResponse.json({ message: 'Invalid or expired verification code' }, { status: 400 });
    }

    // 检查用户是否已存在
    console.log(`Checking if user ${username} already exists`);
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      console.log(`Error: User ${username} already exists`);
      return NextResponse.json({ message: 'User already exists' }, { status: 400 });
    }

    // 哈希密码
    console.log('Hashing password');
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    console.log(`Creating new user: ${username}`);
    const newUser = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
      },
    });

    console.log(`User registered successfully: ${newUser.id}`);
    return NextResponse.json({ message: 'User registered successfully', userId: newUser.id }, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ message: 'Error registering user' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}