import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

// 配置 OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 定义上下文与 token 的粗略限制
const MAX_CONTEXT_MESSAGES = 10; // 保留最近的10条消息
const MAX_TOKENS = 4000;         // 最多 4000 tokens (非常粗略)

// 通过文件后缀或 MIME 判断文件类型
const SUPPORTED_EXTENSIONS = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp'] as string[],
  texts: ['txt', 'md', 'csv', 'json', 'js', 'html', 'css', 'xml', 'yaml', 'yml'] as string[],
  documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf'] as string[],
};

const SUPPORTED_MIMES = {
  images: new Set<string>([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ]),
  texts: new Set<string>([
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'text/javascript',
    'text/html',
    'text/css',
    'application/xml',
    'text/yaml',
  ]),
  documents: new Set<string>([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/rtf',
  ]),
};

// 粗略估算 token 数（平均每 4 个字符 1 个 token）
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

// 判断文件类型
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

// 获取最近的对话历史 (最多 MAX_CONTEXT_MESSAGES 条)
async function getConversationHistory(
  conversationId: string
): Promise<ChatCompletionMessageParam[]> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: MAX_CONTEXT_MESSAGES,
    select: {
      content: true,
      isUser: true,
    },
  });
  // 反转为正序
  messages.reverse();

  return messages.map((m) => ({
    role: m.isUser ? 'user' : 'assistant',
    content: m.content || '',
  }));
}

// 裁剪上下文，避免超过 token 限制
function trimContextToFitTokenLimit(
  messages: ChatCompletionMessageParam[],
  newMessageTokens: number
): ChatCompletionMessageParam[] {
  let totalTokens = newMessageTokens;
  const result: ChatCompletionMessageParam[] = [];

  // 从最后一条往前遍历
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i]!; // 非空断言
    const contentStr = typeof msg.content === 'string' ? msg.content : '';
    const msgTokens = estimateTokenCount(contentStr);
    if (totalTokens + msgTokens <= MAX_TOKENS) {
      result.unshift(msg);
      totalTokens += msgTokens;
    } else {
      break;
    }
  }
  return result;
}

export async function POST(request: Request) {
  try {
    // 验证用户是否登录
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 解析 formData
    const formData = await request.formData();
    const message = formData.get('message') as string;
    const model = (formData.get('model') as string) || 'gpt-4-turbo-preview';
    const conversationId = formData.get('conversationId') as string;

    // 解析 Prompt（如果前端传了）
    const promptData = formData.get('prompt');
    const prompt = promptData ? JSON.parse(promptData.toString()) : null;

    // 收集上传的文件
    const files: File[] = [];
    for (let i = 0; ; i++) {
      const file = formData.get(`file${i}`) as File | null;
      if (!file) break;
      files.push(file);
    }

    // 查找会话
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        userId,
      },
    });
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 更新 conversation.systemPrompt，无论 prompt 是否存在
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { systemPrompt: prompt?.content ?? null },
    });

    // 重新读取，拿到最新 systemPrompt
    const updatedConv = await prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    const systemPrompt = updatedConv?.systemPrompt || null;

    // 获取对话历史
    const conversationHistory = await getConversationHistory(conversationId);

    // 计算当前消息的 tokens
    const newMessageTokens = estimateTokenCount(message);

    // 裁剪历史
    const trimmedHistory = trimContextToFitTokenLimit(conversationHistory, newMessageTokens);

    // 准备要发给 OpenAI 的 messages 数组
    const messages: ChatCompletionMessageParam[] = [];

    // 若有 systemPrompt，就在最前面插入 system 消息
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // 加入裁剪后的历史消息
    messages.push(...trimmedHistory);

    // 再加上用户本次输入
    messages.push({
      role: 'user',
      content: message,
    });

    // 数据库里创建一条用户消息
    await prisma.message.create({
      data: {
        content: message,
        isUser: true,
        conversationId,
        prompt: prompt?.content,
        promptName: prompt?.name,
      },
    });

    // 把文件信息拼接到最后一条用户消息（可选）
    let appendedFileInfo = '';

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileType = getFileType(file);

      switch (fileType) {
        case 'image': {
          // 图片转换为 base64
          const base64Image = buffer.toString('base64');
          const mimeType = file.type || 'image/jpeg';
          const imageUrl = `data:${mimeType};base64,${base64Image}`;

          appendedFileInfo += `\n[已上传图片: ${file.name}]`;

          // 同时在数据库记录
          await prisma.message.create({
            data: {
              content: `已上传图片：${file.name}`,
              isUser: true,
              conversationId,
              fileName: file.name,
              fileType: file.type,
              fileUrl: imageUrl,
              prompt: prompt?.content,
              promptName: prompt?.name,
            },
          });
          break;
        }
        case 'text': {
          const textContent = buffer.toString('utf-8');
          appendedFileInfo += `\n[已上传文本: ${file.name}, 片段: ${textContent.slice(0, 50)}...]`;

          await prisma.message.create({
            data: {
              content: `已上传文本文件：${file.name}`,
              isUser: true,
              conversationId,
              fileName: file.name,
              fileType: file.type,
              fileUrl: textContent,
              prompt: prompt?.content,
              promptName: prompt?.name,
            },
          });
          break;
        }
        case 'document': {
          try {
            const uploadFile = new File([buffer], file.name, {
              type: file.type || 'application/octet-stream',
            });
            const fileUpload = await openai.files.create({
              file: uploadFile,
              purpose: 'assistants',
            });

            appendedFileInfo += `\n[已上传文档: ${file.name}, openai_file_id=${fileUpload.id}]`;

            await prisma.message.create({
              data: {
                content: `已上传文档：${file.name}`,
                isUser: true,
                conversationId,
                fileName: file.name,
                fileType: file.type,
                fileUrl: fileUpload.id,
                prompt: prompt?.content,
                promptName: prompt?.name,
              },
            });
          } catch (error) {
            console.error('File upload error:', error);
            appendedFileInfo += `\n[文件上传失败: ${file.name}]`;

            await prisma.message.create({
              data: {
                content: `文件上传失败：${file.name}`,
                isUser: true,
                conversationId,
                fileName: file.name,
                fileType: file.type,
                prompt: prompt?.content,
                promptName: prompt?.name,
              },
            });
          }
          break;
        }
        default: {
          appendedFileInfo += `\n[不支持的文件类型: ${file.name}]`;
          await prisma.message.create({
            data: {
              content: `不支持的文件类型：${file.name}`,
              isUser: true,
              conversationId,
              fileName: file.name,
              fileType: file.type,
              prompt: prompt?.content,
              promptName: prompt?.name,
            },
          });
        }
      }
    }

    // 将文件信息追加到最后一条用户消息（确保数组非空）
    const lastIndex = messages.length - 1;
    if (lastIndex >= 0) {
      const lastMsg = messages[lastIndex]!;
      if (lastMsg.role === 'user' && appendedFileInfo) {
        lastMsg.content += appendedFileInfo;
      }
    }

    // 调用 OpenAI (流式接口)
    const response = await openai.chat.completions.create({
      model,
      messages,
      stream: true,
      max_tokens: 2000,
    });

    let fullResponse = '';

    // 构建流式响应返回给前端
    const streamResponse = new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              const content = chunk.choices[0]?.delta?.content || '';
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
                fullResponse += content;
              }
            }

            // 流结束后保存 AI 回复到数据库
            await prisma.message.create({
              data: {
                content: fullResponse,
                isUser: false,
                conversationId,
                prompt: prompt?.content,
                promptName: prompt?.name,
              },
            });

            // 更新会话时间
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date() },
            });

            controller.close();
          } catch (err) {
            console.error('Stream processing error:', err);
            controller.error(err);
          }
        },
      })
    );

    return streamResponse;
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json({ error: '处理请求失败' }, { status: 500 });
  }
}
