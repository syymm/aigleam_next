import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { content, conversationId, isUser, fileUrl, fileType, fileName } = await request.json();
    const userId = 1; // TODO: 获取实际的用户ID

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