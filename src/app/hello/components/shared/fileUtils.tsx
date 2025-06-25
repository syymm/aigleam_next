import React from 'react';
import { ImageIcon, DocumentIcon, FileIcon } from './Icons';

export type FileType = 'image' | 'text' | 'document' | 'unknown';

// 文件扩展名和MIME类型常量
export const SUPPORTED_EXTENSIONS = {
  images: ['jpg', 'jpeg', 'png', 'gif', 'webp'] as string[],
  texts: ['txt', 'md', 'csv', 'json', 'js', 'html', 'css', 'xml', 'yaml', 'yml'] as string[],
  documents: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'rtf'] as string[],
};

export const SUPPORTED_MIMES = {
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

/**
 * 判断文件类型
 */
export function getFileType(file: File): FileType {
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (SUPPORTED_EXTENSIONS.images.includes(extension)) return 'image';
  if (SUPPORTED_EXTENSIONS.texts.includes(extension)) return 'text';
  if (SUPPORTED_EXTENSIONS.documents.includes(extension)) return 'document';

  if (SUPPORTED_MIMES.images.has(file.type)) return 'image';
  if (SUPPORTED_MIMES.texts.has(file.type)) return 'text';
  if (SUPPORTED_MIMES.documents.has(file.type)) return 'document';

  return 'unknown';
}

/**
 * 根据文件类型获取对应的图标组件
 * 用于ChatArea中的文件预览
 */
export function getFileIcon(fileType?: string, className?: string): React.ReactElement {
  if (!fileType) return <FileIcon className={className} />;

  if (fileType.startsWith('image/')) {
    return <ImageIcon className={className} style={{ color: '#10b981' }} />;
  } else if (fileType.includes('pdf')) {
    return <DocumentIcon className={className} style={{ color: '#ef4444' }} />;
  } else if (fileType.includes('document') || fileType.includes('text')) {
    return <DocumentIcon className={className} style={{ color: '#3b82f6' }} />;
  }
  return <FileIcon className={className} />;
}

/**
 * 根据文件类型获取对应的图标组件（用于InputArea）
 * 使用不同的颜色方案
 */
export function getFileIconForInput(fileType: string, className?: string): React.ReactElement {
  if (fileType.startsWith('image/')) {
    return <ImageIcon className={className} style={{ color: '#4CAF50' }} />;
  } else if (fileType.includes('pdf')) {
    return <DocumentIcon className={className} style={{ color: '#F44336' }} />;
  } else if (fileType.includes('document') || fileType.includes('text')) {
    return <DocumentIcon className={className} style={{ color: '#2196F3' }} />;
  }
  return <FileIcon className={className} style={{ color: '#757575' }} />;
}