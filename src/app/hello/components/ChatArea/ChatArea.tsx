import React, { useState, useRef, useEffect } from 'react';
import styles from './ChatArea.module.css';
import { useTheme } from '../../../contexts/ThemeContext';
import MessageItem from './MessageItem';
import LoadingIndicator from './LoadingIndicator';
import EmptyState from './EmptyState';
import QuotePopover from './QuotePopover';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  isError?: boolean;
  isImage?: boolean; // 标记是否为AI生成图像
  imageUrl?: string; // AI生成图像的URL
  imagePrompt?: string; // 生成图像的提示词
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

  return (
    <div className={`${styles.chatArea}`}>
      <div className={`${styles.container} ${themeMode === 'dark' ? styles.dark : ''}`}>
        <div className={styles.messagesContainer}>
          {messages.length === 0 && !isLoading && <EmptyState />}
          
          {messages.map((message, index) => {
            // 对于空内容的AI消息，显示输入指示器
            if (!message.isUser && !message.content && !message.isError) {
              return <LoadingIndicator key={message.id} type="typing" showAvatar={true} />;
            }
            return (
              <MessageItem
                key={message.id}
                message={message}
                index={index}
                messages={messages}
                onBestResponse={onBestResponse}
                onErrorResponse={onErrorResponse}
                onTextSelection={handleTextSelection}
              />
            );
          })}
          
          {isLoading && <LoadingIndicator type="breathing" />}
          <div ref={messagesEndRef} />
        </div>

        {/* Quote Popover */}
        <QuotePopover
          show={popover.show}
          x={popover.x}
          y={popover.y}
          text={popover.text}
          onQuote={onQuoteReply}
          onClose={handlePopoverClose}
        />
      </div>
    </div>
  );
};

export default ChatArea;