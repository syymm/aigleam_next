import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { verificationCodeManager } from '../../../utils/verificationCode';

// 初始化Resend客户端
const resend = new Resend(process.env.RESEND_API_KEY);

// 设置定期清理任务（每小时运行一次）
verificationCodeManager.setupCleanupTask();

export async function POST(req: NextRequest) {
  const { username } = await req.json();

  if (!username) {
    return NextResponse.json({ message: '邮箱是必需的' }, { status: 400 });
  }

  try {
    const verificationCode = verificationCodeManager.generateCode();
    verificationCodeManager.storeCode(username, verificationCode);

    // 发送邮件
    await resend.emails.send({
        from: '你的应用 <onboarding@resend.dev>',
        to: username,
        subject: '你的验证码',
        html: `<p>你的验证码是: <strong>${verificationCode}</strong></p>`
      });

    return NextResponse.json({ message: '验证码发送成功' });
  } catch (error) {
    console.error('发送邮件时出错:', error);
    return NextResponse.json({ message: '发送验证码失败' }, { status: 500 });
  }
}
