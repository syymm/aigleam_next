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
const MAX_CONTEXT_MESSAGES = 10; // 保留作为备用，将被智能选择替代

// 动态获取模型Token限制
function getModelTokenLimit(model: string): number {
  const limits: Record<string, number> = {
    'gpt-3.5-turbo': 4096,
    'gpt-3.5-turbo-0301': 4096,
    'gpt-3.5-turbo-16k': 16384,
    'gpt-4': 8192,
    'gpt-4-0314': 8192,
    'gpt-4-32k': 32768,
    'gpt-4-32k-0314': 32768,
    'gpt-4-turbo': 128000,
    'gpt-4o': 128000,
    'gpt-4o-mini': 128000,
  };
  
  const totalLimit = limits[model] || 4096;
  // 预留40%给AI回复，60%用于上下文
  return Math.floor(totalLimit * 0.6);
}

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

// Token计算缓存
const tokenCache = new Map<string, number>();

// 快速Token估算（用于性能优化）
function estimateTokens(content: string): number {
  if (tokenCache.has(content)) {
    return tokenCache.get(content)!;
  }
  
  // 简单估算：中文约3字符=1token，英文约4字符=1token
  const estimate = Math.ceil(content.length / 3.5);
  tokenCache.set(content, estimate);
  return estimate;
}

// 精确Token计算（需要时使用）
function calculateExactTokens(content: string, model: string): number {
  const cacheKey = `${model}:${content}`;
  if (tokenCache.has(cacheKey)) {
    return tokenCache.get(cacheKey)!;
  }
  
  const encoding = getSafeEncoding(model);
  try {
    const tokens = encoding.encode(content).length;
    tokenCache.set(cacheKey, tokens);
    return tokens;
  } finally {
    encoding.free();
  }
}

// 清理Token缓存（防止内存泄漏）
function cleanTokenCache(): void {
  if (tokenCache.size > 1000) {
    // 保留最近的500个条目
    const entries = Array.from(tokenCache.entries());
    tokenCache.clear();
    entries.slice(-500).forEach(([key, value]) => {
      tokenCache.set(key, value);
    });
  }
}

// 消息重要性评分算法
function calculateMessageScore(message: { content: string; isUser: boolean; createdAt: string | Date }): number {
  let score = 0;
  const content = message.content.toLowerCase();
  
  // 1. 时间权重（越新越重要）
  const messageTime = new Date(message.createdAt).getTime();
  const hoursAgo = (Date.now() - messageTime) / (1000 * 60 * 60);
  score += Math.max(0, 10 - hoursAgo * 0.5); // 最近的消息得分更高
  
  // 2. 内容类型权重
  if (content.includes('?') || content.includes('？')) score += 3; // 问题很重要
  if (/^(请|帮|如何|怎么|什么|能否|可以|帮我)/.test(content)) score += 3; // 请求类消息
  if (/^(总结|记住|重要|注意)/.test(content)) score += 4; // 明确的重要信息
  if (/(姓名|名字|电话|邮箱|地址|生日)/.test(content)) score += 3; // 个人信息
  if (/(决定|确定|选择|计划)/.test(content)) score += 2; // 决策信息
  
  // 3. 内容长度权重
  if (message.content.length > 100) score += 1; // 长消息可能更重要
  if (message.content.length > 300) score += 1; // 很长的消息更重要
  
  // 4. 用户vs助手消息权重
  if (message.isUser) {
    score += 1; // 用户消息稍微重要一些
  } else {
    // 助手的详细回答也很重要
    if (message.content.length > 200) score += 1;
  }
  
  // 5. 特殊标记
  if (/(重要|关键|核心|主要)/.test(content)) score += 2;
  if (/(临时|随便|无所谓)/.test(content)) score -= 1;
  
  return Math.max(0, score); // 确保分数不为负
}

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

// 智能选择重要消息
function selectImportantMessages(
  messages: Array<{ content: string; isUser: boolean; createdAt: string | Date }>,
  maxTokens: number
): Array<{ content: string; isUser: boolean; createdAt: string | Date }> {
  if (messages.length === 0) return [];
  
  // 1. 计算每条消息的重要性评分
  const scoredMessages = messages.map(msg => ({
    message: msg,
    score: calculateMessageScore(msg),
    tokens: estimateTokens(msg.content)
  }));
  
  // 2. 按重要性排序（保持最新的几条消息）
  const recentCount = Math.min(5, messages.length); // 最近5条消息优先保留
  const recentMessages = scoredMessages.slice(-recentCount);
  const olderMessages = scoredMessages.slice(0, -recentCount);
  
  // 3. 对较旧的消息按重要性排序
  olderMessages.sort((a, b) => b.score - a.score);
  
  // 4. 组合策略：优先选择最近消息，然后按重要性选择旧消息
  const selected: typeof scoredMessages = [];
  let currentTokens = 0;
  
  // 首先添加最近的消息
  for (const item of recentMessages) {
    if (currentTokens + item.tokens <= maxTokens) {
      selected.push(item);
      currentTokens += item.tokens;
    }
  }
  
  // 然后按重要性添加较旧的消息
  for (const item of olderMessages) {
    if (currentTokens + item.tokens <= maxTokens) {
      selected.push(item);
      currentTokens += item.tokens;
    }
  }
  
  // 5. 按时间顺序重新排列
  const result = selected
    .map(item => item.message)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  
  return result;
}

// 从数据库中获取对话历史（优化版）
async function getConversationHistory(conversationId: string): Promise<Array<{ content: string; isUser: boolean; createdAt: Date }>> {
  // 获取所有消息用于智能筛选（移除token限制，在后续统一处理）
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' }, // 按时间正序获取
    select: { content: true, isUser: true, createdAt: true },
  });
  
  return messages;
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
 * 智能构建对话上下文（新版本）
 */
function buildOptimizedContext(
  systemPrompt: string | null,
  rawHistory: Array<{ content: string; isUser: boolean; createdAt: Date }>,
  userMessage: string,
  model: string
): ExtendedChatCompletionMessageParam[] {
  const context: ExtendedChatCompletionMessageParam[] = [];
  const maxTokens = getModelTokenLimit(model);
  
  // 1. 系统提示（优先级最高）
  let usedTokens = 0;
  if (systemPrompt) {
    const systemMsg = { role: 'system' as const, content: systemPrompt };
    context.push(systemMsg);
    usedTokens += estimateTokens(systemPrompt);
  }
  
  // 2. 当前用户消息（优先级最高）
  const currentTokens = estimateTokens(userMessage);
  usedTokens += currentTokens;
  
  // 3. 预留回复空间
  const reservedTokens = Math.min(2000, maxTokens * 0.3); // 预留30%或2000tokens
  const availableForHistory = maxTokens - usedTokens - reservedTokens;
  
  // 4. 智能选择历史消息
  if (availableForHistory > 0 && rawHistory.length > 0) {
    const selectedHistory = selectImportantMessages(rawHistory, availableForHistory);
    
    // 转换为OpenAI格式
    const historyMessages: ExtendedChatCompletionMessageParam[] = selectedHistory.map(msg => ({
      role: msg.isUser ? 'user' as const : 'assistant' as const,
      content: msg.content
    }));
    
    context.push(...historyMessages);
  }
  
  // 5. 最后添加当前用户消息
  context.push({ role: 'user' as const, content: userMessage });
  
  // 6. 清理缓存（定期维护）
  cleanTokenCache();
  
  return context;
}

/**
 * 兼容性函数：保持原有接口
 * @deprecated 使用 buildOptimizedContext 替代
 */
function buildAndTrimMessages(
  systemPrompt: string | null,
  conversationHistory: ExtendedChatCompletionMessageParam[],
  userMessage: string,
  model: string,
  maxTokens: number
): ExtendedChatCompletionMessageParam[] {
  // 转换格式以兼容新的函数
  const rawHistory = conversationHistory.map(msg => ({
    content: msg.content as string,
    isUser: msg.role === 'user',
    createdAt: new Date() // 使用当前时间作为默认值
  }));
  
  return buildOptimizedContext(systemPrompt, rawHistory, userMessage, model);
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
      // 智能构建对话上下文
      let messages = buildOptimizedContext(systemPrompt, conversationHistory, message, model);

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
    // 将文件信息追加到最后一条用户消息并检查token限制
    let messages = finalMessages;
    if (appendedFileInfo && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        // 更新最后一条用户消息的内容
        const oldContent =
          typeof lastMessage.content === 'string'
            ? lastMessage.content
            : JSON.stringify(lastMessage.content ?? '');
        const updatedContent = oldContent + appendedFileInfo;
        lastMessage.content = updatedContent;
        
        // 检查是否超出token限制，如果超出则重新构建上下文
        const totalTokens = messages.reduce((sum, msg) => sum + estimateTokens(msg.content as string), 0);
        const maxTokens = getModelTokenLimit(model);
        
        if (totalTokens > maxTokens) {
          // 重新构建上下文，使用更新后的用户消息
          messages = buildOptimizedContext(systemPrompt, conversationHistory, updatedContent, model);
        }
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
