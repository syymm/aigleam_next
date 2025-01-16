import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: params.conversationId,
        userId: userId,
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
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: '会话不存在' }, { status: 404 });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: '获取会话失败' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 先验证会话存在并属于当前用户
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        id: params.conversationId,
        userId: userId,
      },
    });

    if (!existingConversation) {
      return NextResponse.json(
        { error: '会话不存在或无权访问' },
        { status: 404 }
      );
    }

    await prisma.conversation.delete({
      where: {
        id: params.conversationId,
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: '删除会话失败' }, { status: 500 });
  }
}