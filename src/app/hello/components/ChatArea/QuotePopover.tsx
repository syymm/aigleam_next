import React from 'react';
import styles from './ChatArea.module.css';
import { QuoteIcon } from '../shared/Icons';
import { useTheme } from '../../../contexts/ThemeContext';

interface QuotePopoverProps {
  show: boolean;
  x: number;
  y: number;
  text: string;
  onQuote: (text: string) => void;
  onClose: () => void;
}

const QuotePopover: React.FC<QuotePopoverProps> = ({
  show,
  x,
  y,
  text,
  onQuote,
  onClose,
}) => {
  const { themeMode } = useTheme();

  if (!show) return null;

  return (
    <div 
      className={`${styles.popover} ${themeMode === 'dark' ? styles.dark : ''}`}
      style={{ 
        left: x, 
        top: y,
        position: 'fixed' 
      }}
    >
      <button
        className={styles.quoteButton}
        onClick={() => {
          onQuote(text);
          onClose();
        }}
      >
        <QuoteIcon />
        引用
      </button>
    </div>
  );
};

export default QuotePopover;