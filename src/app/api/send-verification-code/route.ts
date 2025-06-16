import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { verificationCodeManager } from '../../utils/verificationCode';

const resend = new Resend(process.env.RESEND_API_KEY);

verificationCodeManager.setupCleanupTask();

export async function POST(req: NextRequest) {
  console.log('Received request to send verification code');

  const { username } = await req.json();
  console.log(`Requested verification code for username: ${username}`);

  if (!username) {
    console.log('Error: Email is required');
    return NextResponse.json({ message: '邮箱是必需的' }, { status: 400 });
  }

  // 检查速率限制
  const rateLimit = verificationCodeManager.canRequestCode(username);
  if (!rateLimit.allowed) {
    console.log(`Rate limit exceeded for ${username}`);
    return NextResponse.json({ 
      message: rateLimit.message || '请求过于频繁，请稍后再试',
      waitTime: rateLimit.waitTime 
    }, { status: 429 });
  }

  try {
    const verificationCode = verificationCodeManager.generateCode();
    console.log(`Generated verification code: ${verificationCode}`);

    verificationCodeManager.storeCode(username, verificationCode);
    console.log(`Stored verification code for ${username}`);

    console.log(`Attempting to send email to ${username}`);
    await resend.emails.send({
      from: '你的应用 <onboarding@resend.dev>',
      to: username,
      subject: '你的验证码',
      html: `<p>你的验证码是: <strong>${verificationCode}</strong></p>`
    });
    console.log(`Email sent successfully to ${username}`);

    return NextResponse.json({ message: '验证码发送成功' });
  } catch (error) {
    console.error('发送邮件时出错:', error);
    return NextResponse.json({ message: '发送验证码失败' }, { status: 500 });
  }
}