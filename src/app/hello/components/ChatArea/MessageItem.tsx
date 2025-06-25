import React from 'react';
import styles from './ChatArea.module.css';
import { UserIcon, BotIcon, ErrorIcon } from '../shared/Icons';
import { getFileIcon } from '../shared/fileUtils';
import MessageActions from './MessageActions';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  isError?: boolean;
  isImage?: boolean;
  imageUrl?: string;
  imagePrompt?: string;
}

interface MessageItemProps {
  message: Message;
  index: number;
  messages: Message[];
  onBestResponse: (messageId: string) => void;
  onErrorResponse: (messageId: string) => void;
  onTextSelection: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  index,
  messages,
  onBestResponse,
  onErrorResponse,
  onTextSelection,
}) => {
  const isFileMessage = message.fileName && message.fileType;

  const findRelatedFileMessages = () => {
    const fileMessages: Message[] = [];
    for (let i = index + 1; i < messages.length; i++) {
      const nextMsg = messages[i];
      if (!nextMsg || !nextMsg.isUser || !nextMsg.fileName) break;
      fileMessages.push(nextMsg);
    }
    return fileMessages;
  };

  const relatedFileMessages = !isFileMessage ? findRelatedFileMessages() : [];

  const previousMessage = index > 0 ? messages[index - 1] : null;
  
  // 如果是文件消息且前一条消息是用户消息，则跳过渲染（避免重复）
  if (isFileMessage && previousMessage?.isUser) {
    return null;
  }

  return (
    <div className={`${styles.messageGroup} ${message.isUser ? styles.user : ''}`}>
      {/* Avatar */}
      <div className={`${styles.avatar} ${message.isUser ? styles.user : styles.ai}`}>
        {message.isUser ? <UserIcon /> : <BotIcon />}
      </div>

      {/* Message Content */}
      <div className={`${styles.messageContent} ${message.isUser ? styles.user : ''}`}>
        <div 
          className={`${styles.messageBubble} ${message.isUser ? styles.user : styles.ai} ${message.isError ? styles.error : ''}`}
          onMouseUp={onTextSelection}
        >
          {/* AI生成的图像 */}
          {message.isImage && message.imageUrl && (
            <div className={styles.imageMessage}>
              {message.imagePrompt && (
                <div className={styles.imagePrompt}>
                  提示词: {message.imagePrompt}
                </div>
              )}
              <img
                src={message.imageUrl}
                alt={message.imagePrompt || '生成的图像'}
                className={styles.generatedImage}
                onLoad={() => {
                  console.log('🖼️ 图像加载成功:', message.imageUrl);
                }}
                onError={(e) => {
                  console.error('❌ 图像加载失败:', message.imageUrl);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {/* Text Content */}
          {message.content && !message.content.startsWith('已上传') && !message.isImage && (
            <div className={`${styles.messageText} ${message.isError ? styles.error : ''}`}>
              {message.isError && <ErrorIcon className={styles.errorIcon} />}
              <span>{message.content}</span>
            </div>
          )}

          {/* Text Content for Image Messages */}
          {message.isImage && message.content && (
            <div className={styles.messageText}>
              <span>{message.content}</span>
            </div>
          )}

          {/* Files */}
          {(isFileMessage || relatedFileMessages.length > 0) && (
            <div className={styles.filesContainer}>
              {(isFileMessage ? [message] : relatedFileMessages).map((fileMsg) => (
                <div 
                  key={fileMsg.id} 
                  className={`${styles.filePreview} ${message.isUser ? styles.user : styles.ai}`}
                >
                  {fileMsg.fileType?.startsWith('image/') && fileMsg.fileUrl ? (
                    <img
                      src={fileMsg.fileUrl}
                      alt={fileMsg.fileName}
                      className={styles.imagePreview}
                    />
                  ) : (
                    <>
                      {getFileIcon(fileMsg.fileType, styles.fileIcon)}
                      <span className={`${styles.fileName} ${message.isUser ? styles.user : ''}`}>
                        {fileMsg.fileName}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Message Actions - Only for AI messages that are not errors */}
        {!message.isUser && !message.isError && (
          <MessageActions
            messageId={message.id}
            onBestResponse={onBestResponse}
            onErrorResponse={onErrorResponse}
          />
        )}
      </div>
    </div>
  );
};

export default MessageItem;