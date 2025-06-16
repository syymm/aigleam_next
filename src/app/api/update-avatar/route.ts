import { NextResponse } from 'next/server';

// 支持的图片格式
const SUPPORTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp'
]);

// 支持的文件扩展名
const SUPPORTED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'];

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('avatar') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: '没有找到文件' },
        { status: 400 }
      );
    }

    // 验证文件类型
    const fileType = file.type.toLowerCase();
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!SUPPORTED_IMAGE_TYPES.has(fileType) && !SUPPORTED_EXTENSIONS.includes(extension)) {
      return NextResponse.json(
        { error: '不支持的图片格式，请上传 JPG、PNG、GIF、WebP 或 BMP 格式的图片' },
        { status: 400 }
      );
    }

    // 验证文件大小 (例如限制为 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '图片大小不能超过 5MB' },
        { status: 400 }
      );
    }

    // 这里添加你的文件处理逻辑
    // 例如：上传到云存储或保存到本地
    const avatarUrl = URL.createObjectURL(file);

    return NextResponse.json({ avatarUrl });
  } catch (error) {
    console.error('头像上传失败:', error);
    return NextResponse.json(
      { error: '头像上传失败' },
      { status: 500 }
    );
  }
} 