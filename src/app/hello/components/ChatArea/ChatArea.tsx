import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatArea.module.css';
import { useTheme } from '../../../contexts/ThemeContext';

// Custom SVG Icons
const ThumbUpIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 10v12"></path>
    <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
  </svg>
);

const ThumbDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 14V2"></path>
    <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"></path>
  </svg>
);

const QuoteIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
  </svg>
);

const BotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 8V4H8"></path>
    <rect width="16" height="12" x="4" y="8" rx="2"></rect>
    <path d="M2 14h2"></path>
    <path d="M20 14h2"></path>
    <path d="M15 13v2"></path>
    <path d="M9 13v2"></path>
  </svg>
);

const ChatBotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    <circle cx="12" cy="11" r="1"></circle>
    <circle cx="16" cy="11" r="1"></circle>
    <circle cx="8" cy="11" r="1"></circle>
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

const ErrorIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

const ImageIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg className={className} style={style} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21,15 16,10 5,21"></polyline>
  </svg>
);

const DocumentIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg className={className} style={style} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14,2 14,8 20,8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10,9 9,9 8,9"></polyline>
  </svg>
);

const FileIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg className={className} style={style} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
    <polyline points="13,2 13,9 20,9"></polyline>
  </svg>
);

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  isError?: boolean;
}

interface ChatAreaProps {
  messages: Message[];
  onBestResponse: (messageId: string) => void;
  onErrorResponse: (messageId: string) => void;
  onQuoteReply: (content: string) => void;
  isLoading?: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onBestResponse,
  onErrorResponse,
  onQuoteReply,
  isLoading = false,
}) => {
  const [popover, setPopover] = useState<{
    show: boolean;
    x: number;
    y: number;
    text: string;
  }>({ show: false, x: 0, y: 0, text: '' });
  
  const { theme, themeMode } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTextSelection = (event: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() !== '') {
      const rect = event.currentTarget.getBoundingClientRect();
      setPopover({
        show: true,
        x: event.clientX,
        y: rect.bottom + 8,
        text: selection.toString()
      });
    } else {
      setPopover(prev => ({ ...prev, show: false }));
    }
  };

  const handlePopoverClose = () => {
    setPopover(prev => ({ ...prev, show: false }));
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return <FileIcon className={styles.fileIcon} />;

    if (fileType.startsWith('image/')) {
      return <ImageIcon className={styles.fileIcon} style={{ color: '#10b981' }} />;
    } else if (fileType.includes('pdf')) {
      return <DocumentIcon className={styles.fileIcon} style={{ color: '#ef4444' }} />;
    } else if (fileType.includes('document') || fileType.includes('text')) {
      return <DocumentIcon className={styles.fileIcon} style={{ color: '#3b82f6' }} />;
    }
    return <FileIcon className={styles.fileIcon} />;
  };

  const renderMessage = (message: Message, index: number) => {
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
    if (isFileMessage && previousMessage?.isUser) {
      return null;
    }

    return (
      <div key={message.id} className={`${styles.messageGroup} ${message.isUser ? styles.user : ''}`}>
        {/* Avatar */}
        <div className={`${styles.avatar} ${message.isUser ? styles.user : styles.ai}`}>
          {message.isUser ? <UserIcon /> : <BotIcon />}
        </div>

        {/* Message Content */}
        <div className={`${styles.messageContent} ${message.isUser ? styles.user : ''}`}>
          <div 
            className={`${styles.messageBubble} ${message.isUser ? styles.user : styles.ai} ${message.isError ? styles.error : ''}`}
            onMouseUp={handleTextSelection}
          >
            {/* Text Content */}
            {message.content && !message.content.startsWith('已上传') && (
              <div className={`${styles.messageText} ${message.isError ? styles.error : ''}`}>
                {message.isError && <ErrorIcon className={styles.errorIcon} />}
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
                        {getFileIcon(fileMsg.fileType)}
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
            <div className={styles.messageActions}>
              <button 
                className={`${styles.actionButton} ${styles.like}`}
                onClick={() => onBestResponse(message.id)}
                title="点赞"
              >
                <ThumbUpIcon />
              </button>
              <button 
                className={`${styles.actionButton} ${styles.dislike}`}
                onClick={() => onErrorResponse(message.id)}
                title="踩"
              >
                <ThumbDownIcon />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`${styles.chatArea}`}>
      <div className={`${styles.container} ${themeMode === 'dark' ? styles.dark : ''}`}>
        <div className={styles.messagesContainer}>
          {messages.length === 0 && !isLoading && (
            <div className={styles.emptyState}>
              <ChatBotIcon className={styles.emptyStateIcon} />
              <p className={styles.emptyStateText}>开始新的对话</p>
              <p className={styles.emptyStateSubtext}>输入消息开始与AI助手对话</p>
            </div>
          )}
          {messages.map((message, index) => renderMessage(message, index))}
          {isLoading && (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner} />
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quote Popover */}
        {popover.show && (
          <div 
            className={`${styles.popover} ${themeMode === 'dark' ? styles.dark : ''}`}
            style={{ 
              left: popover.x, 
              top: popover.y,
              position: 'fixed' 
            }}
          >
            <button
              className={styles.quoteButton}
              onClick={() => {
                onQuoteReply(popover.text);
                handlePopoverClose();
              }}
            >
              <QuoteIcon />
              引用
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatArea;