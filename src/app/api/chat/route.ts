import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { 
  ChatCompletionMessageParam,
  ChatCompletionContentPart,
  ChatCompletionContentPartImage,
  ChatCompletionContentPartText
} from 'openai/resources/chat/completions';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// 定义窗口大小和token限制
const MAX_CONTEXT_MESSAGES = 10; // 保留最近的10条消息
const MAX_TOKENS = 4000; // 设置token上限
const TOKEN_LIMIT_PER_MESSAGE = 500; // 每条消息的预估token数

type MessageContent = ChatCompletionContentPartText | ChatCompletionContentPartImage;

const SUPPORTED_EXTENSIONS = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp'] as string[],
  texts: ['txt', 'md', 'csv', 'json', 'js', 'html', 'css', 'xml', 'yaml', 'yml'] as string[],
  documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf'] as string[]
};

const SUPPORTED_MIMES = {
  images: new Set<string>([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
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
    'text/yaml'
  ]),
  documents: new Set<string>([
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

// 粗略估算token数量
function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4); // 粗略估计：平均每个token 4个字符
}

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

// 获取对话历史
async function getConversationHistory(conversationId: string): Promise<ChatCompletionMessageParam[]> {
  const messages = await prisma.message.findMany({
    where: {
      conversationId: conversationId,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: MAX_CONTEXT_MESSAGES,
    select: {
      content: true,
      isUser: true
    }
  });

  // 反转消息顺序，使其按时间正序排列
  messages.reverse();

  // 将消息转换为OpenAI消息格式，确保每个消息都有有效的内容
  return messages.map(msg => ({
    role: msg.isUser ? "user" as const : "assistant" as const,
    content: msg.content || '', // 提供默认值以避免 undefined
  }));
}

// 裁剪上下文以适应token限制
function trimContextToFitTokenLimit(
  messages: ChatCompletionMessageParam[],
  newMessageTokens: number
): ChatCompletionMessageParam[] {
  let totalTokens = newMessageTokens;
  const result: ChatCompletionMessageParam[] = [];
  
  // 从最新的消息开始，向前添加消息直到达到token限制
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg && typeof msg.content === 'string') {
      const msgTokens = estimateTokenCount(msg.content);
      
      if (totalTokens + msgTokens <= MAX_TOKENS) {
        result.unshift(msg);
        totalTokens += msgTokens;
      } else {
        break;
      }
    }
  }
  
  return result;
}

export async function POST(request: Request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const message = formData.get('message') as string;
    const model = formData.get('model') as string || 'gpt-4-turbo-preview';
    const conversationId = formData.get('conversationId') as string;
    
    // 获取prompt信息
    const promptData = formData.get('prompt');
    const prompt = promptData ? JSON.parse(promptData as string) : null;
    
    // 收集所有文件
    const files: File[] = [];
    for (let i = 0; ; i++) {
      const file = formData.get(`file${i}`) as File | null;
      if (!file) break;
      files.push(file);
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
        userId: userId
      }
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // 获取对话历史
    const conversationHistory = await getConversationHistory(conversationId);
    
    // 计算新消息的token数量
    const newMessageTokens = estimateTokenCount(message);
    
    // 根据token限制裁剪上下文
    const trimmedHistory = trimContextToFitTokenLimit(conversationHistory, newMessageTokens);

    // 准备发送给OpenAI的消息数组
    let messages: ChatCompletionMessageParam[] = [...trimmedHistory];
    
    // 如果有prompt，将其作为system message添加到消息列表开头
    if (prompt) {
      messages.unshift({
        role: "system",
        content: prompt.content
      });
    }

    // 添加用户当前消息
    messages.push({
      role: "user",
      content: message
    });

    // 创建主消息
    const userMessage = await prisma.message.create({
      data: {
        content: message,
        isUser: true,
        conversationId,
        prompt: prompt?.content,
        promptName: prompt?.name,
      }
    });

    const imageContents: ChatCompletionContentPartImage[] = [];

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
          
          const imageContent: ChatCompletionContentPartImage = {
            type: "image_url",
            image_url: { url: imageUrl }
          };
          
          imageContents.push(imageContent);

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
            }
          });
          break;
        }
        case 'text': {
          const textContent = buffer.toString('utf-8');
          
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
              }
            });
          } catch (error) {
            console.error('File upload error:', error);
            
            await prisma.message.create({
              data: {
                content: `文件上传失败：${file.name}`,
                isUser: true,
                conversationId,
                fileName: file.name,
                fileType: file.type,
                prompt: prompt?.content,
                promptName: prompt?.name,
              }
            });
          }
          break;
        }
        default: {
          await prisma.message.create({
            data: {
              content: `不支持的文件类型：${file.name}`,
              isUser: true,
              conversationId,
              fileName: file.name,
              fileType: file.type,
              prompt: prompt?.content,
              promptName: prompt?.name,
            }
          });
        }
      }
    }

    // 更新 OpenAI 消息，处理图片内容
    if (imageContents.length > 0) {
      const textContent: ChatCompletionContentPartText = {
        type: "text",
        text: message
      };

      // 重构最后一条用户消息，包含文本和图片
      messages = [
        ...messages.slice(0, -1),
        {
          role: "user",
          content: [textContent, ...imageContents] as MessageContent[]
        }
      ];
    }

    // 创建OpenAI聊天完成请求
    const response = await openai.chat.completions.create({
      model: model,
      messages: messages as ChatCompletionMessageParam[],
      stream: true,
      max_tokens: 2000,
    });

    let fullResponse = '';

    // 创建流式响应
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
            
            // 在流结束时保存完整的 AI 回复
            await prisma.message.create({
              data: {
                content: fullResponse,
                isUser: false,
                conversationId,
                prompt: prompt?.content,
                promptName: prompt?.name,
              }
            });

            // 更新会话时间
            await prisma.conversation.update({
              where: { id: conversationId },
              data: { updatedAt: new Date() }
            });

            controller.close();
          } catch (error) {
            console.error('Stream processing error:', error);
            controller.error(error);
          }
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