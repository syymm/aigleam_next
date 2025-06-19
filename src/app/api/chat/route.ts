import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { encoding_for_model, TiktokenModel } from 'tiktoken';

// 如果 ChatCompletionMessageParam 里没有 name，可以在本地扩展：
type ExtendedChatCompletionMessageParam = ChatCompletionMessageParam & {
  name?: string;
};

// 配置常量
const MAX_CONTEXT_MESSAGES = 10;
const MAX_TOKENS = 4000;

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

function getFileType(file: File): 'image' | 'text' | 'document' | 'unknown' {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (SUPPORTED_EXTENSIONS.images.includes(extension)) return 'image';
  if (SUPPORTED_EXTENSIONS.texts.includes(extension)) return 'text';
  if (SUPPORTED_EXTENSIONS.documents.includes(extension)) return 'document';

  if (SUPPORTED_MIMES.images.has(file.type)) return 'image';
  if (SUPPORTED_MIMES.texts.has(file.type)) return 'text';
  if (SUPPORTED_MIMES.documents.has(file.type)) return 'document';

  return 'unknown';
}

// 从数据库中获取对话历史
async function getConversationHistory(conversationId: string): Promise<ExtendedChatCompletionMessageParam[]> {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'desc' },
    take: MAX_CONTEXT_MESSAGES,
    select: { content: true, isUser: true },
  });
  messages.reverse();
  return messages.map((m) => ({
    role: m.isUser ? 'user' : 'assistant',
    // 如果数据库里 content 不一定是 string，则做判断转换：
    content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
  }));
}

/**
 * 安全获取 tiktoken 的 encoding
 * 如果传入的 model 不在 TiktokenModel 范围内，则 fallback 到 'gpt-3.5-turbo'
 */
function getSafeEncoding(model: string) {
  const knownModels: TiktokenModel[] = [
    'gpt-3.5-turbo',
    'gpt-3.5-turbo-0301',
    'gpt-4',
    'gpt-4-0314',
    'gpt-4-32k',
    'gpt-4-32k-0314',
    // ... 其它你需要支持的模型
  ];
  if (knownModels.includes(model as TiktokenModel)) {
    return encoding_for_model(model as TiktokenModel);
  } else {
    return encoding_for_model('gpt-3.5-turbo');
  }
}

/**
 * 用 tiktoken 计算消息总 Token 数
 * 如果消息内容不是 string，则先转成 string 再 encode
 */
function countChatTokens(messages: ExtendedChatCompletionMessageParam[], model: string): number {
  const encoding = getSafeEncoding(model);

  try {
    let tokensPerMessage = 4;
    let tokensPerName = -1;
    if (model.startsWith('gpt-4')) {
      tokensPerMessage = 3;
      tokensPerName = 1;
    }

    let totalTokens = 0;
    for (const msg of messages) {
      totalTokens += tokensPerMessage;
      const contentStr = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
      totalTokens += encoding.encode(contentStr).length;
      if (msg.name) {
        totalTokens += tokensPerName;
      }
    }

    // 回复结尾额外加上 3 tokens
    totalTokens += 3;
    return totalTokens;
  } finally {
    // 确保 encoding 被释放，即使出现异常
    encoding.free();
  }
}

/**
 * 组合 systemPrompt + 历史消息 + 新用户消息，并在超过上限时裁剪旧消息
 */
function buildAndTrimMessages(
  systemPrompt: string | null,
  conversationHistory: ExtendedChatCompletionMessageParam[],
  userMessage: string,
  model: string,
  maxTokens: number
): ExtendedChatCompletionMessageParam[] {
  const built: ExtendedChatCompletionMessageParam[] = [];

  if (systemPrompt) {
    built.push({ role: 'system', content: systemPrompt });
  }
  built.push(...conversationHistory);
  built.push({ role: 'user', content: userMessage });

  let totalTokens = countChatTokens(built, model);
  if (totalTokens <= maxTokens) return built;

  // 超出上限时，从最早的历史消息开始删除（保留 systemPrompt 和最新消息）
  let startIndex = systemPrompt ? 1 : 0;
  while (startIndex < built.length - 1 && totalTokens > maxTokens) {
    built.splice(startIndex, 1);
    totalTokens = countChatTokens(built, model);
  }
  return built;
}

export async function POST(request: Request) {
  try {
    // 验证 API Key
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API Key 未配置' }, { status: 500 });
    }

    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const message = (formData.get('message') as string) || '';
    const model = (formData.get('model') as string) || 'gpt-3.5-turbo';
    const conversationId = formData.get('conversationId') as string;

    const promptData = formData.get('prompt');
    const prompt = promptData ? JSON.parse(promptData.toString()) : null;

    // 收集上传文件
    const files: File[] = [];
    for (let i = 0;; i++) {
      const file = formData.get(`file${i}`) as File | null;
      if (!file) break;
      files.push(file);
    }

    // 查找会话
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId, userId },
    });
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 更新 systemPrompt
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { systemPrompt: prompt?.content ?? null },
    });

    // 获取最新 systemPrompt
    const updatedConv = await prisma.conversation.findUnique({ where: { id: conversationId } });
    const systemPrompt = updatedConv?.systemPrompt || null;

    // 获取对话历史
    const conversationHistory = await getConversationHistory(conversationId);

    // 使用数据库事务处理消息和文件保存
    const { messages: finalMessages, appendedFileInfo } = await prisma.$transaction(async (prisma) => {
      // 合并 systemPrompt、历史消息和当前用户消息，并裁剪 token
      let messages = buildAndTrimMessages(systemPrompt, conversationHistory, message, model, MAX_TOKENS);

      // 数据库记录用户输入
      await prisma.message.create({
        data: {
          content: message,
          isUser: true,
          conversationId,
          prompt: prompt?.content,
          promptName: prompt?.name,
        },
      });

      // 处理上传文件，将相关信息追加到用户消息中
      let appendedFileInfo = '';
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      for (const file of files) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileType = getFileType(file);

        switch (fileType) {
          case 'image': {
            const base64Image = buffer.toString('base64');
            const mimeType = file.type || 'image/jpeg';
            const imageUrl = `data:${mimeType};base64,${base64Image}`;
            appendedFileInfo += `\n[已上传图片: ${file.name}]`;

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
              // 上传到 OpenAI（如果需要）
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
              console.error('文件上传失败:', error);
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

      return { messages, appendedFileInfo };
    });
    // 将文件信息追加到最后一条用户消息
    let messages = finalMessages;
    if (appendedFileInfo && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        // 如果 content 为 undefined 则赋予空字符串作为默认值
        const oldContent =
          typeof lastMessage.content === 'string'
            ? lastMessage.content
            : JSON.stringify(lastMessage.content ?? '');
        lastMessage.content = oldContent + appendedFileInfo;
      }
    }

    // 追加文件信息后可能超出 token 限制，再次裁剪（以最后一条用户消息为准）
    if (messages.length > 0) {
      const lastUserMsg = messages[messages.length - 1]?.role === 'user'
        ? messages[messages.length - 1]
        : undefined;
      if (lastUserMsg) {
        const lastContentStr =
          typeof lastUserMsg.content === 'string'
            ? lastUserMsg.content
            : JSON.stringify(lastUserMsg.content ?? '');
        messages = buildAndTrimMessages(systemPrompt, conversationHistory, lastContentStr, model, MAX_TOKENS);
      }
    }

    // 调用 OpenAI，流式返回响应
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.chat.completions.create({
      model,
      messages,
      stream: true,
      max_tokens: 2000,
    });

    let fullResponse = '';

    const streamResponse = new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of response) {
              // 注意：content 可能不是 string，这里统一转为 string
              const content =
                typeof chunk.choices[0]?.delta?.content === 'string'
                  ? chunk.choices[0]?.delta?.content
                  : '';
              if (content) {
                controller.enqueue(new TextEncoder().encode(content));
                fullResponse += content;
              }
            }

            // 流结束后保存 AI 回复到数据库（使用事务）
            await prisma.$transaction(async (prisma) => {
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
            });

            controller.close();
          } catch (err) {
            console.error('处理流错误:', err);
            controller.error(err);
          }
        },
      })
    );

    return streamResponse;
  } catch (error) {
    console.error('OpenAI API error:', error);
    
    // 详细的错误处理
    if (error instanceof Error) {
      const errorMessage = error.message.toLowerCase();
      
      if (errorMessage.includes('invalid api key') || errorMessage.includes('unauthorized')) {
        return NextResponse.json({ error: 'API密钥无效或未授权' }, { status: 401 });
      }
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
        return NextResponse.json({ error: '请求频率过高，请稍后重试' }, { status: 429 });
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('billing')) {
        return NextResponse.json({ error: 'API配额已用完，请检查账单' }, { status: 402 });
      }
      
      if (errorMessage.includes('model') && errorMessage.includes('not found')) {
        return NextResponse.json({ error: '指定的模型不存在' }, { status: 400 });
      }
      
      if (errorMessage.includes('context length') || errorMessage.includes('maximum context')) {
        return NextResponse.json({ error: '消息内容过长，请减少文本长度' }, { status: 400 });
      }
      
      if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        return NextResponse.json({ error: '网络连接异常，请重试' }, { status: 503 });
      }
      
      if (errorMessage.includes('timeout')) {
        return NextResponse.json({ error: '请求超时，请重试' }, { status: 504 });
      }
      
      // 返回具体错误信息（在开发环境中）
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({ error: `处理请求失败: ${error.message}` }, { status: 500 });
      }
    }
    
    return NextResponse.json({ error: '处理请求失败，请稍后重试' }, { status: 500 });
  }
}
