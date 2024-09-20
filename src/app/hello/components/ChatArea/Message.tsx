import React from 'react';

interface MessageProps {
  content: string;
  isUser: boolean;
  // 其他必要的属性
}

const Message: React.FC<MessageProps> = ({ content, isUser }) => {
  return (
    <div className={`message ${isUser ? 'user' : 'ai'}`}>
      {content}
    </div>
  );
};

export default Message;