import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { verificationCodeManager } from '../../utils/verificationCode';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { step, email, password, confirmPassword, verificationCode, userId } = body;

    // 步骤1: 验证邮箱
    if (step === 1) {
      // 检查邮箱是否为空
      if (!email || !email.trim()) {
        return NextResponse.json(
          { error: '邮箱不能为空' },
          { status: 400 }
        );
      }

      // 邮箱格式验证
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: '邮箱格式错误' },
          { status: 400 }
        );
      }

      // 在数据库中查找用户名
      const user = await prisma.user.findUnique({
        where: {
          username: email.toLowerCase(),
        },
        select: {
          id: true,
          username: true,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: '用户名不存在' },
          { status: 404 }
        );
      }

      // 验证成功
      return NextResponse.json(
        {
          message: '验证成功',
          userId: user.id
        },
        { status: 200 }
      );
    }

    // 步骤2: 重置密码
    if (step === 2) {
      // 验证必填字段
      if (!email || !password || !confirmPassword || !verificationCode || !userId) {
        return NextResponse.json(
          { error: '所有字段都是必填的' },
          { status: 400 }
        );
      }

      // 验证两次密码是否一致
      if (password !== confirmPassword) {
        return NextResponse.json(
          { error: '两次输入的密码不一致' },
          { status: 400 }
        );
      }

      // 验证密码长度
      if (password.length < 6) {
        return NextResponse.json(
          { error: '密码长度不能少于6位' },
          { status: 400 }
        );
      }

      // 验证验证码
      const isCodeValid = verificationCodeManager.verifyCode(email, verificationCode);
      if (!isCodeValid) {
        return NextResponse.json(
          { error: '验证码无效或已过期' },
          { status: 400 }
        );
      }

      // 查找用户
      const user = await prisma.user.findUnique({
        where: {
          id: userId,
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: '用户不存在' },
          { status: 404 }
        );
      }

      // 生成新的密码哈希
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 更新用户密码
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          password: hashedPassword,
        },
      });

      return NextResponse.json(
        { message: '密码重置成功' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: '无效的步骤' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}