import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

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
  // 获取文件扩展名（转换为小写）
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  
  // 首先检查文件扩展名
  if (SUPPORTED_EXTENSIONS.images.includes(extension)) {
    return 'image';
  }
  if (SUPPORTED_EXTENSIONS.texts.includes(extension)) {
    return 'text';
  }
  if (SUPPORTED_EXTENSIONS.documents.includes(extension)) {
    return 'document';
  }

  // 如果扩展名检查未确定类型，则检查 MIME 类型
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
    const formData = await request.formData();
    const message = formData.get('message') as string;
    const model = formData.get('model') as string;
    const file = formData.get('file') as File | null;

    let messages: ChatCompletionMessageParam[] = [{
      role: "user",
      content: message
    }];

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
          break;
        }
        case 'text': {
          const textContent = buffer.toString('utf-8');
          messages = [{
            role: "user",
            content: `${message}\n\n文件内容：\n${textContent}`
          }];
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

    const completion = await openai.chat.completions.create({
      model: model,
      messages: messages,
      max_tokens: 2000,
    });

    const reply = completion.choices[0]?.message?.content || '';

    return NextResponse.json({ 
      reply,
      messageId: Date.now().toString()
    });
  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: '处理请求失败' },
      { status: 500 }
    );
  }
}