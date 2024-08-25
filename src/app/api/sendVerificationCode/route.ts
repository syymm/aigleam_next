// app/api/sendVerificationCode/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { saveVerificationCode } from '@/utils/verificationCodeStore';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const { email } = await request.json();

  if (!email) {
    return NextResponse.json({ message: '邮箱是必需的' }, { status: 400 });
  }

  try {
    // 生成一个随机的6位验证码
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // 保存验证码
    saveVerificationCode(email, verificationCode);

    // 使用Resend发送验证码邮件
    const { data, error } = await resend.emails.send({
      from: 'Your App <onboarding@resend.dev>',
      to: email,
      subject: '您的验证码',
      html: `<p>您的验证码是: <strong>${verificationCode}</strong></p><p>此验证码将在10分钟后过期。</p>`
    });

    if (error) {
      console.error('发送验证码邮件时出错:', error);
      return NextResponse.json({ message: '发送验证码邮件时出错' }, { status: 500 });
    }

    return NextResponse.json({ message: '验证码已发送到您的邮箱' }, { status: 200 });
  } catch (error) {
    console.error('发送验证码时出错:', error);
    return NextResponse.json({ message: '发送验证码时出错' }, { status: 500 });
  }
}