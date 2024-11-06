import React, { useState, KeyboardEvent, useRef, ChangeEvent } from 'react';
import { TextField, IconButton, Box } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useTheme } from '../../../contexts/ThemeContext'; // 更新导入路径
import styles from '../../styles/ChatPage.module.css';

interface InputAreaProps {
  onSendMessage: (content: string, file?: File) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage }) => {
  const { theme, themeMode } = useTheme(); // 使用自定义的 useTheme
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (inputValue.trim() || selectedFile) {
      onSendMessage(inputValue, selectedFile || undefined);
      setInputValue('');
      setSelectedFile(null);
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
      setSelectedFile(event.target.files[0]);
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
          placeholder="输入消息..."
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
        accept="image/*,.pdf,.doc,.docx,.txt"  // 可以根据需要调整接受的文件类型
      />
    </Box>
  );
};

export default InputArea;
