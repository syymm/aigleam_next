import React, { useState, KeyboardEvent, useRef, ChangeEvent } from 'react';
import { TextField, IconButton, Box, useTheme } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';

interface InputAreaProps {
  onSendMessage: (content: string, file?: File) => void;
}

const InputArea: React.FC<InputAreaProps> = ({ onSendMessage }) => {
  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const theme = useTheme();
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
    <Box sx={{ 
      padding: 2, 
      backgroundColor: theme.palette.background.default,
      display: 'flex',
      justifyContent: 'center',
    }}>
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center',
        backgroundColor: theme.palette.background.paper,
        borderRadius: 1,
        padding: 1,
        width: '70%',
      }}>
        <IconButton onClick={handleAttachClick} color="primary">
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
            style: { color: theme.palette.text.primary },
          }}
          placeholder={selectedFile ? `已选择文件: ${selectedFile.name}` : "输入消息..."}
        />
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <IconButton onClick={handleSend} color="primary">
          <SendIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default InputArea;