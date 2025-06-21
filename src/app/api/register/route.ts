import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verificationCodeManager } from '../../utils/verificationCode';
import { AuthService } from '@/lib/services/auth.service';
import { RegisterRequest, RegisterResponse } from '@/lib/types/api';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  console.log('Received a POST request to /api/register');
  
  // 清除可能存在的认证cookie，确保注册后需要重新登录
  AuthService.clearAuthCookie();
  
  try {
    const { username, verificationCode, password }: RegisterRequest = await request.json();

    console.log(`Received registration request for username: ${username}`);

    if (!username || !verificationCode || !password) {
      console.log('Error: Missing required fields');
      return NextResponse.json({ message: '请填写所有必填项' }, { status: 400 });
    }

    // 验证验证码
    console.log(`Attempting to verify code: ${verificationCode} for user: ${username}`);
    const isCodeValid = verificationCodeManager.verifyCode(username, verificationCode);
    console.log(`Verification code valid: ${isCodeValid}`);

    if (!isCodeValid) {
      console.log(`Error: Invalid or expired verification code for user: ${username}`);
      return NextResponse.json({ message: '验证码无效或已过期' }, { status: 400 });
    }

    // 检查用户是否已存在
    console.log(`Checking if user ${username} already exists`);
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      console.log(`Error: User ${username} already exists`);
      return NextResponse.json({ message: '该邮箱已被注册' }, { status: 400 });
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
    const response: RegisterResponse = { message: '注册成功', userId: newUser.id };
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json({ message: '注册失败，请稍后重试' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}