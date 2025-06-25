import React from 'react';
import styles from './ChatArea.module.css';
import { ChatBotIcon } from '../shared/Icons';

const EmptyState: React.FC = () => {
  return (
    <div className={styles.emptyState}>
      <ChatBotIcon className={styles.emptyStateIcon} />
      <p className={styles.emptyStateText}>开始新的对话</p>
      <p className={styles.emptyStateSubtext}>输入消息开始与AI助手对话</p>
    </div>
  );
};

export default EmptyState;