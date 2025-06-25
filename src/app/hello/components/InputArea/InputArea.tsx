import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import styles from './InputArea.module.css';
import { useTheme } from '../../../contexts/ThemeContext';
import { SendIcon, AttachIcon, CloseIcon } from '../shared/Icons';
import { getFileIconForInput } from '../shared/fileUtils';

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
                    {getFileIconForInput(file.type, styles.fileIcon)}
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
