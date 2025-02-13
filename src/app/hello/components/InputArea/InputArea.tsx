import React, { useState, useRef, ChangeEvent } from 'react';
import { 
  TextField, 
  IconButton, 
  Box, 
  Tooltip,
  Chip,
  Typography,
  alpha 
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import ImageIcon from '@mui/icons-material/Image';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import MagicWandIcon from '@mui/icons-material/AutoFixHigh';
import CancelIcon from '@mui/icons-material/Cancel';
import { useTheme } from '../../../contexts/ThemeContext';
import CustomizeAIDialog from '../Dialogs/CustomizeAIDialog';
import PromptSelectionDialog from './PromptSelectionDialog';

interface InputAreaProps {
  onSendMessage: (message: string, files: File[], activePrompt?: Prompt | null) => void;
}

interface Prompt {
  id?: string;
  name: string;
  content: string;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage }) => {
  const { theme } = useTheme();

  const [inputValue, setInputValue] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isPromptSelectionOpen, setIsPromptSelectionOpen] = useState(false);
  const [isCustomizeDialogOpen, setIsCustomizeDialogOpen] = useState(false);
  // activePrompt 不会在发送消息后自动清除，只在用户点击叉号时清除
  const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // 发送消息时只清除输入框和文件，不清除 activePrompt
  const handleSend = () => {
    if (inputValue.trim() || selectedFiles.length > 0) {
      onSendMessage(inputValue, selectedFiles, activePrompt);
      setInputValue('');
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLDivElement>) => {
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

  // 当用户选择一个 Prompt 后，设置 activePrompt，但不清除它（除非用户手动取消）
  const handlePromptSelect = (selectedPrompt: Prompt) => {
    setActivePrompt(selectedPrompt);
    setIsPromptSelectionOpen(false);
    // 如果输入框有内容或有文件，则可以立即发送一次消息，但仍保持 activePrompt
    if (inputValue.trim() || selectedFiles.length > 0) {
      onSendMessage(inputValue, selectedFiles, selectedPrompt);
      setInputValue('');
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // 当用户点击叉号时，清除 activePrompt，从而使后续发送不再附带该提示词
  const handleClearPrompt = () => {
    setActivePrompt(null);
  };

  const handleOpenCustomize = () => {
    setIsPromptSelectionOpen(false);
    setIsCustomizeDialogOpen(true);
  };

  const getFileIcon = (fileType: string) => {
    const iconStyle = {
      fontSize: '16px',
      marginRight: '4px',
    };

    if (fileType.startsWith('image/')) {
      return <ImageIcon sx={{ ...iconStyle, color: '#4CAF50' }} />;
    } else if (fileType.includes('pdf')) {
      return <DescriptionIcon sx={{ ...iconStyle, color: '#F44336' }} />;
    } else if (fileType.includes('document') || fileType.includes('text')) {
      return <InsertDriveFileIcon sx={{ ...iconStyle, color: '#2196F3' }} />;
    }
    return <InsertDriveFileIcon sx={{ ...iconStyle, color: '#757575' }} />;
  };

  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
      {/* 如果有 activePrompt，就显示提示词的 Chip */}
      {activePrompt && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            mb: 1,
          }}
        >
          <Chip
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MagicWandIcon sx={{ fontSize: 16 }} />
                <Typography variant="body2">
                  使用中的提示词: {activePrompt.name}
                </Typography>
              </Box>
            }
            onDelete={handleClearPrompt}
            deleteIcon={<CancelIcon />}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '& .MuiChip-label': { display: 'flex', alignItems: 'center' },
            }}
          />
        </Box>
      )}

      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative' }}>
        <Box
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            backgroundColor: theme.palette.background.paper,
            borderRadius: '16px',
            padding: '8px 16px',
            width: '70%',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            border: isDragging ? `2px dashed ${theme.palette.primary.main}` : `1px solid ${theme.palette.divider}`,
            transition: 'all 0.2s ease',
            position: 'relative',
          }}
        >
          {isDragging && (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(25, 118, 210, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '16px',
                zIndex: 1,
                pointerEvents: 'none',
                backdropFilter: 'blur(2px)',
                transition: 'all 0.2s ease',
              }}
            >
              <Box sx={{ color: theme.palette.primary.main, fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <AttachFileIcon sx={{ fontSize: 32 }} />
                松开鼠标上传文件
              </Box>
            </Box>
          )}

          {selectedFiles.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '4px', padding: '4px 8px', marginBottom: '4px', ml: '40px' }}>
              {selectedFiles.map((file, index) => (
                <Box
                  key={`${file.name}-${index}`}
                  sx={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: theme.palette.action.hover, borderRadius: '4px', maxWidth: 'fit-content' }}
                >
                  {getFileIcon(file.type)}
                  <span style={{ fontSize: '0.875rem', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {file.name}
                  </span>
                  <IconButton size="small" onClick={() => handleRemoveFile(index)} sx={{ padding: '2px', marginLeft: '2px', '&:hover': { backgroundColor: 'rgba(0,0,0,0.04)' } }}>
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', position: 'relative', zIndex: 2 }}>
            <Tooltip title="上传文件" placement="top">
              <IconButton onClick={handleAttachClick} sx={{ color: theme.palette.primary.main, padding: '8px', '&:hover': { backgroundColor: 'transparent' } }}>
                <AttachFileIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="选择提示词" placement="top">
              <IconButton onClick={() => setIsPromptSelectionOpen(true)} sx={{ color: theme.palette.primary.main, padding: '8px', '&:hover': { backgroundColor: 'transparent' } }}>
                <MagicWandIcon />
              </IconButton>
            </Tooltip>

            <TextField
              fullWidth
              variant="standard"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                disableUnderline: true,
                style: { color: theme.palette.text.primary },
              }}
              placeholder={selectedFiles.length > 0 ? "添加消息描述..." : "输入消息..."}
              multiline
              maxRows={5}
              sx={{
                flexGrow: 1,
                '& .MuiInputBase-input': {
                  padding: '12px 8px',
                  '&::placeholder': { color: theme.palette.text.secondary, opacity: 0.7 },
                },
                '& .MuiInputBase-root': { backgroundColor: 'transparent', alignItems: 'center' },
              }}
            />

            <IconButton onClick={handleSend} sx={{ color: theme.palette.primary.main, padding: '8px', '&:hover': { backgroundColor: 'transparent' } }}>
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx,.txt" multiple />

      {isPromptSelectionOpen && (
        <PromptSelectionDialog
          open={isPromptSelectionOpen}
          onClose={() => setIsPromptSelectionOpen(false)}
          onSelect={handlePromptSelect}
          onOpenCustomize={handleOpenCustomize}
        />
      )}

      {isCustomizeDialogOpen && (
        <CustomizeAIDialog open={isCustomizeDialogOpen} onClose={() => setIsCustomizeDialogOpen(false)} />
      )}
    </Box>
  );
};

export default InputArea;
