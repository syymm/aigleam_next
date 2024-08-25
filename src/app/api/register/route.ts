// app/api/register/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { verifyCode, deleteVerificationCode } from '@/utils/verificationCodeStore';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { email, verificationCode, password, confirmPassword } = await request.json();

    // 验证输入
    if (!email || !verificationCode || !password || !confirmPassword) {
      return NextResponse.json({ message: '所有字段都是必需的' }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ message: '两次输入的密码不匹配' }, { status: 400 });
    }

    // 验证验证码
    if (!verifyCode(email, verificationCode)) {
      return NextResponse.json({ message: '无效或已过期的验证码' }, { status: 400 });
    }

    // 检查邮箱是否已被注册
    const existingUser = await prisma.user.findUnique({
      where: { username: email },
    });

    if (existingUser) {
      return NextResponse.json({ message: '该邮箱已被注册' }, { status: 400 });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建新用户
    const newUser = await prisma.user.create({
      data: {
        username: email,
        password: hashedPassword,
      },
    });

    // 删除已使用的验证码
    deleteVerificationCode(email);

    return NextResponse.json({ message: '注册成功', userId: newUser.id }, { status: 201 });
  } catch (error) {
    console.error('注册用户时出错:', error);
    return NextResponse.json({ message: '注册用户时出错' }, { status: 500 });
  }
}