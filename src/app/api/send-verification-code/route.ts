import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { verificationCodeManager } from '../../utils/verificationCode';
import { VerificationCodeRequest, VerificationCodeResponse } from '@/lib/types/api';
import { ipLimiter } from '@/lib/utils/ip-limiter';
import { getClientIP } from '@/lib/utils/get-client-ip';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

verificationCodeManager.setupCleanupTask();

export async function POST(req: NextRequest) {
  console.log('Received request to send verification code');

  // IP限制检查
  const clientIP = getClientIP(req);
  const ipCheck = ipLimiter.isAllowed(clientIP);
  
  if (!ipCheck.allowed) {
    console.log(`IP ${clientIP} is rate limited`);
    const waitMinutes = Math.ceil((ipCheck.waitTime || 0) / (60 * 1000));
    return NextResponse.json({ 
      message: `请求过于频繁，请在 ${waitMinutes} 分钟后重试`,
      waitTime: ipCheck.waitTime 
    }, { status: 429 });
  }

  const { username }: VerificationCodeRequest = await req.json();
  console.log(`Requested verification code for username: ${username} from IP: ${clientIP}`);

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
    await transporter.sendMail({
      from: `"你的应用" <${process.env.GMAIL_EMAIL}>`,
      to: username,
      subject: '你的验证码',
      html: `<p>你的验证码是: <strong>${verificationCode}</strong></p>
             <p>该验证码10分钟内有效，请及时使用。</p>`
    });
    console.log(`Email sent successfully to ${username}`);

    const response: VerificationCodeResponse = { message: '验证码发送成功' };
    return NextResponse.json(response);
  } catch (error) {
    console.error('发送邮件时出错:', error);
    return NextResponse.json({ message: '发送验证码失败' }, { status: 500 });
  }
}