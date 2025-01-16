import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

export async function POST(request: Request) {
  console.log('Rename API endpoint called');
  
  try {
    const userId = await getCurrentUserId();
    console.log('Current user ID:', userId);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId, title } = await request.json();
    console.log('Request data:', { conversationId, title });

    // 验证输入
    if (!conversationId || !title || title.trim() === '') {
      return NextResponse.json(
        { error: '会话ID和标题不能为空' },
        { status: 400 }
      );
    }

    // 验证会话存在并属于当前用户
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: userId,
      },
    });
    console.log('Existing conversation:', existingConversation);

    if (!existingConversation) {
      return NextResponse.json(
        { error: '会话不存在或无权访问' },
        { status: 404 }
      );
    }

    // 使用 Prisma 的事务来确保原子性
    const updatedConversation = await prisma.$transaction(async (prisma) => {
      const updated = await prisma.conversation.update({
        where: {
          id: conversationId,
        },
        data: {
          title: title.trim(),
          updatedAt: new Date(),
        },
        include: {
          messages: {
            select: {
              id: true,
              content: true,
              isUser: true,
              fileName: true,
              fileType: true,
              fileUrl: true,
              createdAt: true
            },
            orderBy: {
              createdAt: 'asc'
            }
          }
        }
      });
      console.log('Updated conversation:', updated);
      return updated;
    });

    return NextResponse.json(updatedConversation);
  } catch (error) {
    console.error('Error in rename operation:', error);
    return NextResponse.json(
      { error: '重命名失败', details: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    );
  }
}