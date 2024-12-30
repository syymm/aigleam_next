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

const SUPPORTED_EXTENSIONS = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  texts: ['txt', 'md', 'csv', 'json', 'js', 'html', 'css', 'xml', 'yaml', 'yml'],
  documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf']
};

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
    
    // 收集所有文件
    const files: File[] = [];
    for (let i = 0; ; i++) {
      const file = formData.get(`file${i}`) as File;
      if (!file) break;
      files.push(file);
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        userId: userId  // userId 已经是数字类型，无需 parseInt
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    let messages: ChatCompletionMessageParam[] = [{
      role: "user",
      content: message
    }];

    let messageContent = message;
    const imageUrls: { type: "image_url", image_url: { url: string } }[] = [];

    // 创建主消息
    const userMessage = await prisma.message.create({
      data: {
        content: messageContent,
        isUser: true,
        conversationId,
      }
    });

    // 处理所有文件
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileType = getFileType(file);

      switch (fileType) {
        case 'image': {
          const base64Image = buffer.toString('base64');
          const mimeType = file.type || 'image/jpeg';
          const imageUrl = `data:${mimeType};base64,${base64Image}`;
          
          imageUrls.push({
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          });

          // 为图片创建单独的消息
          await prisma.message.create({
            data: {
              content: `已上传图片：${file.name}`,
              isUser: true,
              conversationId,
              fileName: file.name,
              fileType: file.type,
              fileUrl: imageUrl
            }
          });

          messageContent += `\n[图片：${file.name}]`;
          break;
        }
        case 'text': {
          const textContent = buffer.toString('utf-8');
          const fileMessage = `\n\n文件内容（${file.name}）：\n${textContent}`;
          messageContent += fileMessage;
          
          await prisma.message.create({
            data: {
              content: textContent,
              isUser: true,
              conversationId,
              fileName: file.name,
              fileType: file.type
            }
          });
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
            const fileMessage = `\n\n已上传文档文件：${file.name}\n文件ID：${fileUpload.id}`;
            messageContent += fileMessage;

            await prisma.message.create({
              data: {
                content: `已上传文档：${file.name}`,
                isUser: true,
                conversationId,
                fileName: file.name,
                fileType: file.type
              }
            });
          } catch (error) {
            console.error('File upload error:', error);
            const errorMessage = `\n\n文档文件上传失败：${file.name}`;
            messageContent += errorMessage;
            
            await prisma.message.create({
              data: {
                content: `文件上传失败：${file.name}`,
                isUser: true,
                conversationId,
                fileName: file.name,
                fileType: file.type
              }
            });
          }
          break;
        }
        default: {
          const unsupportedMessage = `\n\n不支持的文件类型：${file.name}`;
          messageContent += unsupportedMessage;
          
          await prisma.message.create({
            data: {
              content: `不支持的文件类型：${file.name}`,
              isUser: true,
              conversationId,
              fileName: file.name,
              fileType: file.type
            }
          });
        }
      }
    }

    // 更新主消息的内容
    await prisma.message.update({
      where: { id: userMessage.id },
      data: { content: messageContent }
    });

    // 更新 OpenAI 消息
    if (imageUrls.length > 0) {
      messages = [{
        role: "user",
        content: [
          { type: "text", text: messageContent },
          ...imageUrls
        ]
      }];
    } else {
      messages = [{
        role: "user",
        content: messageContent
      }];
    }

    const response = await openai.chat.completions.create({
      model: model,
      messages: messages,
      stream: true,
      max_tokens: 2000,
    });

    let fullResponse = '';

    const streamResponse = new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(content));
              fullResponse += content;
            }
          }
          
          // 在流结束时保存完整的 AI 回复
          await prisma.message.create({
            data: {
              content: fullResponse,
              isUser: false,
              conversationId,
            }
          });

          // 更新会话时间
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
          });

          controller.close();
        }
      })
    );

    return streamResponse;

  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: '处理请求失败' },
      { status: 500 }
    );
  }
}