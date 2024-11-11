import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
      // 解析请求体
      const body = await request.json();
      const { email } = body;
      
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
          username: email.toLowerCase(),  // 查找 username 字段
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
  
    } catch (error) {
      console.error('Email verification error:', error);
      return NextResponse.json(
        { error: '服务器错误，请稍后重试' },
        { status: 500 }
      );
    }
  }