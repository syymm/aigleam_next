import React, { useState, KeyboardEvent, useRef, ChangeEvent } from 'react';
import { TextField, IconButton, Box } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useTheme } from '../../../contexts/ThemeContext';
import styles from '../../styles/ChatPage.module.css';
import { InputAreaProps } from '../../types';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage }) => {
  const { theme, themeMode } = useTheme();
  const [inputValue, setInputValue] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // 改为数组
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (inputValue.trim() || selectedFiles.length > 0) {
      onSendMessage(inputValue, selectedFiles); // 传递文件数组
      setInputValue('');
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
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
      const files = Array.from(event.target.files);
      const validFiles = files.filter(file => {
        if (file.size > 10 * 1024 * 1024) { // 10MB 限制
          alert(`文件 ${file.name} 大小不能超过10MB`);
          return false;
        }
        return true;
      });
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType: string) => {
    const iconStyle = {
      fontSize: '16px',
      marginRight: '4px',
    };

    if (fileType.startsWith('image/')) {
      return <ImageIcon sx={{ ...iconStyle, color: '#4CAF50' }} />; // 图片文件使用绿色
    } else if (fileType.includes('pdf')) {
      return <DescriptionIcon sx={{ ...iconStyle, color: '#F44336' }} />; // PDF文件使用红色
    } else if (fileType.includes('document') || fileType.includes('text')) {
      return <InsertDriveFileIcon sx={{ ...iconStyle, color: '#2196F3' }} />; // 文档使用蓝色
    }
    return <InsertDriveFileIcon sx={{ ...iconStyle, color: '#757575' }} />; // 其他文件使用灰色
  };

  return (
    <Box sx={{ 
      p: 2,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      position: 'relative',
    }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'stretch',
        backgroundColor: theme.palette.background.paper,
        borderRadius: '16px',
        padding: '8px 16px',
        width: '70%',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
        border: `1px solid ${theme.palette.divider}`,
      }}>
        {/* 文件预览区域 */}
        {selectedFiles.length > 0 && (
          <Box sx={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px',
            padding: '4px 8px',
            marginBottom: '4px',
            ml: '40px',
          }}>
            {selectedFiles.map((file, index) => (
              <Box
                key={`${file.name}-${index}`}
                sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  backgroundColor: theme.palette.action.hover,
                  borderRadius: '4px',
                  maxWidth: 'fit-content',
                }}
              >
                {getFileIcon(file.type)}
                <span style={{ 
                  fontSize: '0.875rem',
                  maxWidth: '200px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {file.name}
                </span>
                <IconButton
                  size="small"
                  onClick={() => handleRemoveFile(index)}
                  sx={{ 
                    padding: '2px',
                    marginLeft: '2px',
                    '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' }
                  }}
                >
                  <CloseIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}

        {/* 输入区域 */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
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
              },
            }}
            placeholder={selectedFiles.length > 0 ? "添加消息描述..." : "输入消息..."}
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
              },
              '& .MuiInputBase-root': {
                backgroundColor: 'transparent',
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
      </Box>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        accept="image/*,.pdf,.doc,.docx,.txt"
        multiple
      />
    </Box>
  );
};

export default InputArea;