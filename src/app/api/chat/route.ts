import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 支持的文件扩展名（不区分大小写）
const SUPPORTED_EXTENSIONS = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  texts: ['txt', 'md', 'csv', 'json', 'js', 'html', 'css', 'xml', 'yaml', 'yml'],
  documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf']
};

// 支持的 MIME 类型
const SUPPORTED_MIMES = {
  images: new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]),
  texts: new Set([
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'text/javascript',
    'text/html',
    'text/css',
    'application/xml',
    'text/yaml'
  ]),
  documents: new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/rtf'
  ])
};

function getFileType(file: File): 'image' | 'text' | 'document' | 'unknown' {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  if (SUPPORTED_EXTENSIONS.images.includes(extension)) {
    return 'image';
  }
  if (SUPPORTED_EXTENSIONS.texts.includes(extension)) {
    return 'text';
  }
  if (SUPPORTED_EXTENSIONS.documents.includes(extension)) {
    return 'document';
  }

  if (SUPPORTED_MIMES.images.has(file.type)) {
    return 'image';
  }
  if (SUPPORTED_MIMES.texts.has(file.type)) {
    return 'text';
  }
  if (SUPPORTED_MIMES.documents.has(file.type)) {
    return 'document';
  }

  return 'unknown';
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const message = formData.get('message') as string;
    const model = formData.get('model') as string;
    const conversationId = formData.get('conversationId') as string;
    const file = formData.get('file') as File | null;

    // 验证会话所有权
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        userId,
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    let messages: ChatCompletionMessageParam[] = [{
      role: "user",
      content: message
    }];

    let fileInfo = null;

    if (file) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileType = getFileType(file);

      switch (fileType) {
        case 'image': {
          const base64Image = buffer.toString('base64');
          const mimeType = file.type || 'image/jpeg';
          messages = [{
            role: "user",
            content: [
              {
                type: "text",
                text: message
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`,
                }
              }
            ]
          }];
          fileInfo = {
            fileName: file.name,
            fileType: file.type,
            fileUrl: `data:${mimeType};base64,${base64Image}`
          };
          break;
        }
        case 'text': {
          const textContent = buffer.toString('utf-8');
          messages = [{
            role: "user",
            content: `${message}\n\n文件内容：\n${textContent}`
          }];
          fileInfo = {
            fileName: file.name,
            fileType: file.type,
            fileContent: textContent
          };
          break;
        }
        case 'document': {
          try {
            const uploadFile = new File([buffer], file.name, { 
              type: file.type || 'application/octet-stream'
            });
            const fileUpload = await openai.files.create({
              file: uploadFile,
              purpose: "assistants",
            });
            messages = [{
              role: "user",
              content: `${message}\n\n已上传文档文件：${file.name}\n文件ID：${fileUpload.id}`
            }];
            fileInfo = {
              fileName: file.name,
              fileType: file.type,
              fileId: fileUpload.id
            };
          } catch (error) {
            console.error('File upload error:', error);
            messages = [{
              role: "user",
              content: `${message}\n\n文档文件上传失败：${file.name}`
            }];
          }
          break;
        }
        default: {
          messages = [{
            role: "user",
            content: `${message}\n\n不支持的文件类型：${file.name}`
          }];
        }
      }
    }

    // 保存用户消息
    const userMessage = await prisma.message.create({
      data: {
        content: message,
        isUser: true,
        conversationId,
        ...(fileInfo && {
          fileName: fileInfo.fileName,
          fileType: fileInfo.fileType,
          fileUrl: fileInfo.fileUrl
        })
      }
    });

    // 调用 OpenAI API
    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: 2000,
    });

    const reply = completion.choices[0]?.message?.content || '';

    // 保存 AI 回复
    const aiMessage = await prisma.message.create({
      data: {
        content: reply,
        isUser: false,
        conversationId
      }
    });

    // 更新会话的最后更新时间
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() }
    });

    return NextResponse.json({
      reply,
      messageId: aiMessage.id,
      userMessageId: userMessage.id
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: '处理请求失败' },
      { status: 500 }
    );
  }
}