import React from 'react';
import styles from './ChatArea.module.css';
import { ThumbUpIcon, ThumbDownIcon } from '../shared/Icons';

interface MessageActionsProps {
  messageId: string;
  onBestResponse: (messageId: string) => void;
  onErrorResponse: (messageId: string) => void;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  messageId,
  onBestResponse,
  onErrorResponse,
}) => {
  return (
    <div className={styles.messageActions}>
      <button 
        className={`${styles.actionButton} ${styles.like}`}
        onClick={() => onBestResponse(messageId)}
        title="点赞"
      >
        <ThumbUpIcon />
      </button>
      <button 
        className={`${styles.actionButton} ${styles.dislike}`}
        onClick={() => onErrorResponse(messageId)}
        title="踩"
      >
        <ThumbDownIcon />
      </button>
    </div>
  );
};

export default MessageActions;