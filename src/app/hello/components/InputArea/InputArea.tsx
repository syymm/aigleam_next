import React, { useState, KeyboardEvent, useRef, ChangeEvent } from 'react';
import { TextField, IconButton, Box } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useTheme } from '../../../contexts/ThemeContext';
import styles from '../../styles/ChatPage.module.css';
import { InputAreaProps } from '../../types';

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage }) => {
  const { theme, themeMode } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (inputValue.trim() || selectedFile) {
      onSendMessage(inputValue, selectedFile || undefined);
      setInputValue('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // 清空文件输入
      }
    }
  };

  const handleKeyPress = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      // 可以在这里添加文件类型和大小的验证
      if (file.size > 10 * 1024 * 1024) { // 10MB 限制
        alert('文件大小不能超过10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box 
      className={themeMode === 'dark' ? styles.dark : styles.light}
      sx={{ 
        padding: 2, 
        backgroundColor: theme.palette.background.default,
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        backgroundColor: theme.palette.background.paper,
        borderRadius: '16px',
        padding: '8px 16px',
        width: '70%',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${theme.palette.divider}`,
      }}>
        <IconButton 
          onClick={handleAttachClick} 
          sx={{ 
            color: theme.palette.primary.main,
            padding: '8px',
            '&:hover': { backgroundColor: 'transparent' }
          }}
        >
          <AttachFileIcon />
        </IconButton>
        
        {selectedFile && (
          <Box sx={{ 
            position: 'absolute',
            top: '-30px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: theme.palette.background.paper,
            padding: '4px 12px',
            borderRadius: '8px',
            fontSize: '0.875rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span>{selectedFile.name}</span>
            <IconButton
              size="small"
              onClick={() => setSelectedFile(null)}
              sx={{ padding: '2px' }}
            >
              ×
            </IconButton>
          </Box>
        )}

        <TextField
          fullWidth
          variant="standard"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          InputProps={{
            disableUnderline: true,
            style: { 
              color: theme.palette.text.primary,
              scrollbarWidth: 'thin',
              scrollbarColor: `${theme.palette.grey[400]} ${theme.palette.background.paper}`,
            },
          }}
          placeholder={selectedFile ? "添加消息描述..." : "输入消息..."}
          multiline
          maxRows={5}
          sx={{
            flexGrow: 1,
            '& .MuiInputBase-input': {
              padding: '12px 8px',
              '&::placeholder': {
                color: theme.palette.text.secondary,
                opacity: 0.7,
              },
              '&::-webkit-scrollbar': {
                width: '8px',
              },
              '&::-webkit-scrollbar-track': {
                backgroundColor: theme.palette.background.paper,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: theme.palette.grey[400],
                borderRadius: '4px',
              },
              '&::-webkit-scrollbar-thumb:hover': {
                backgroundColor: theme.palette.grey[600],
              },
            },
            '& .MuiInputBase-root': {
              backgroundColor: 'transparent',
              overflowY: 'auto',
              display: 'flex',
              alignItems: 'center',
            },
          }}
        />
        <IconButton 
          onClick={handleSend} 
          sx={{ 
            color: theme.palette.primary.main,
            padding: '8px',
            '&:hover': { backgroundColor: 'transparent' }
          }}
        >
          <SendIcon />
        </IconButton>
      </Box>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
    </Box>
  );
};

export default InputArea;