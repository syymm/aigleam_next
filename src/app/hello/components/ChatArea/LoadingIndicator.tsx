import React from 'react';
import styles from './ChatArea.module.css';
import { BotIcon } from '../shared/Icons';

interface LoadingIndicatorProps {
  type?: 'breathing' | 'typing';
  showAvatar?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  type = 'breathing',
  showAvatar = false 
}) => {
  if (type === 'typing') {
    return (
      <div className={`${styles.messageGroup} ${styles.ai}`}>
        <div className={styles.messageWrapper}>
          <div className={styles.avatar}>
            <BotIcon className={styles.avatarIcon} />
          </div>
          <div className={styles.messageContent}>
            <div className={styles.typingIndicator}>
              <div className={styles.typingDot}></div>
              <div className={styles.typingDot}></div>
              <div className={styles.typingDot}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loadingContainer}>
      <div className={styles.breathingDots}>
        <div className={styles.breathingDot}></div>
        <div className={styles.breathingDot}></div>
        <div className={styles.breathingDot}></div>
      </div>
    </div>
  );
};

export default LoadingIndicator;