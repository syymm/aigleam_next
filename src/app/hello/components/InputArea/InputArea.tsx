import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import styles from './InputArea.module.css';
import { useTheme } from '../../../contexts/ThemeContext';

// Custom SVG Icons
const SendIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg className={className} style={style} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"></line>
    <polygon points="22,2 15,22 11,13 2,9 22,2"></polygon>
  </svg>
);

const AttachIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg className={className} style={style} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66L9.64 16.2a2 2 0 0 1-2.83-2.83l8.49-8.49"></path>
  </svg>
);

const CloseIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg className={className} style={style} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

const ImageIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg className={className} style={style} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
    <circle cx="8.5" cy="8.5" r="1.5"></circle>
    <polyline points="21,15 16,10 5,21"></polyline>
  </svg>
);

const DocumentIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg className={className} style={style} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
    <polyline points="14,2 14,8 20,8"></polyline>
    <line x1="16" y1="13" x2="8" y2="13"></line>
    <line x1="16" y1="17" x2="8" y2="17"></line>
    <polyline points="10,9 9,9 8,9"></polyline>
  </svg>
);

const FileIcon: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className, style }) => (
  <svg className={className} style={style} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
    <polyline points="13,2 13,9 20,9"></polyline>
  </svg>
);

interface InputAreaProps {
  onSendMessage: (message: string, files: File[]) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage }) => {
  const { theme } = useTheme();

  const [inputValue, setInputValue] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const dragCounter = useRef(0);

  // Auto-resize textarea
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const handleSend = () => {
    if (inputValue.trim() || selectedFiles.length > 0) {
      onSendMessage(inputValue, selectedFiles);
      setInputValue('');
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const validateFiles = (files: File[]) => {
    return files.filter(file => {
      if (file.size > 10 * 1024 * 1024) {
        alert(`文件 ${file.name} 大小不能超过10MB`);
        return false;
      }
      return true;
    });
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      const validFiles = validateFiles(files);
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current++;
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      const validFiles = validateFiles(files);
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <ImageIcon className={styles.fileIcon} style={{ color: '#4CAF50' }} />;
    } else if (fileType.includes('pdf')) {
      return <DocumentIcon className={styles.fileIcon} style={{ color: '#F44336' }} />;
    } else if (fileType.includes('document') || fileType.includes('text')) {
      return <DocumentIcon className={styles.fileIcon} style={{ color: '#2196F3' }} />;
    }
    return <FileIcon className={styles.fileIcon} style={{ color: '#757575' }} />;
  };

  return (
    <div className={styles.inputArea}>
      <div className={styles.container}>
        <div className={styles.inputWrapper}>
          <div
            className={`${styles.inputContainer} ${isDragging ? styles.dragging : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {isDragging && (
              <div className={styles.dropOverlay}>
                <div className={styles.dropText}>
                  <AttachIcon />
                  松开鼠标上传文件
                </div>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className={styles.filesContainer}>
                {selectedFiles.map((file, index) => (
                  <div key={`${file.name}-${index}`} className={styles.fileChip}>
                    {getFileIcon(file.type)}
                    <span className={styles.fileName}>
                      {file.name}
                    </span>
                    <button 
                      className={styles.removeButton}
                      onClick={() => handleRemoveFile(index)}
                      type="button"
                      aria-label={`Remove ${file.name}`}
                    >
                      <CloseIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.inputRow}>
              <button 
                className={styles.attachButton}
                onClick={handleAttachClick}
                type="button"
                title="上传文件"
                aria-label="上传文件"
              >
                <AttachIcon />
              </button>

              <textarea
                ref={textAreaRef}
                className={styles.textArea}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={selectedFiles.length > 0 ? "添加消息描述..." : "输入消息..."}
                rows={1}
              />

              <button 
                className={styles.sendButton}
                onClick={handleSend}
                disabled={!inputValue.trim() && selectedFiles.length === 0}
                type="button"
                title="发送消息"
                aria-label="发送消息"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileSelect} 
          className={styles.hiddenInput}
          accept="image/*,.pdf,.doc,.docx,.txt" 
          multiple 
        />
      </div>
    </div>
  );
};

export default InputArea;
