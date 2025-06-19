import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, conversationId, isUser, fileUrl, fileType, fileName } = body;

    // 输入验证
    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: '消息内容不能为空' }, { status: 400 });
    }
    
    if (!conversationId || typeof conversationId !== 'string') {
      return NextResponse.json({ error: '会话ID不能为空' }, { status: 400 });
    }
    
    if (typeof isUser !== 'boolean') {
      return NextResponse.json({ error: '无效的用户标识' }, { status: 400 });
    }
    
    if (content.length > 10240) { // 10KB限制
      return NextResponse.json({ error: '消息内容过长' }, { status: 400 });
    }

    // 验证会话所有权
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        userId,
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: '会话不存在或无权访问' },
        { status: 404 }
      );
    }

    const message = await prisma.message.create({
      data: {
        content,
        isUser,
        conversationId,
        fileUrl,
        fileType,
        fileName,
      }
    });

    // 更新会话的更新时间
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '创建消息失败' },
      { status: 500 }
    );
  }
}