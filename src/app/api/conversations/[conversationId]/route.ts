import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const userId = 1; // TODO: 获取实际的用户ID
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: params.conversationId,
        userId, // 确保只能查看自己的会话
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!conversation) {
      return NextResponse.json(
        { error: '会话不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '获取会话失败' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { title } = await request.json();
    const userId = 1; // TODO: 获取实际的用户ID

    const conversation = await prisma.conversation.update({
      where: {
        id: params.conversationId,
        userId, // 确保只能更新自己的会话
      },
      data: { title }
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '更新会话失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { conversationId: string } }
) {
  try {
    const userId = 1; // TODO: 获取实际的用户ID

    await prisma.conversation.delete({
      where: {
        id: params.conversationId,
        userId, // 确保只能删除自己的会话
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '删除会话失败' },
      { status: 500 }
    );
  }
}