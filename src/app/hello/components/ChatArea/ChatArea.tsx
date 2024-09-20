import React, { useState } from 'react';
import { Box, Paper, Typography, IconButton, Snackbar, Popover } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import AutorenewIcon from '@mui/icons-material/Autorenew';

interface ChatAreaProps {
  messages: Array<{ id: string; content: string; isUser: boolean }>;
  onBestResponse: (messageId: string) => void;
  onErrorResponse: (messageId: string) => void;
  onQuoteReply: (content: string) => void;
  onSwitchModel: () => void;
}

const MessagePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  maxWidth: '70%',
  position: 'relative',
}));

const ChatArea: React.FC<ChatAreaProps> = ({ messages, onBestResponse, onErrorResponse, onQuoteReply }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedText, setSelectedText] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const theme = useTheme();

  const handleTextSelection = (event: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim() !== '') {
      setSelectedText(selection.toString());
      setAnchorEl(event.currentTarget);
    } else {
      setAnchorEl(null);
    }
  };
  
  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setSnackbarOpen(true);
  };

  const handleReadAloud = (content: string) => {
    // 实现文本朗读功能
    const speech = new SpeechSynthesisUtterance(content);
    window.speechSynthesis.speak(speech);
  };

  const handleSwitchModel = () => {
    // 实现切换模型的逻辑
    // 这可能需要与父组件通信来切换模型
  };

  return (
    <Box sx={{ 
      flexGrow: 1, 
      overflow: 'auto', 
      p: 2, 
      pt: (theme) => `calc(${theme.spacing(2)} + ${theme.mixins.toolbar.minHeight}px)`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      backgroundColor: theme.palette.background.default,
    }}>
      <Box sx={{ width: '70%', maxWidth: '70%' }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.isUser ? 'flex-end' : 'flex-start',
            }}
          >
            <MessagePaper elevation={1} onMouseUp={handleTextSelection}>
              <Typography>{message.content}</Typography>
              {!message.isUser && (
                <Box sx={{ position: 'absolute', right: 8, bottom: 8, display: 'flex' }}>
                  <IconButton size="small" onClick={() => handleReadAloud(message.content)}>
                    <VolumeUpIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleCopy(message.content)}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => onBestResponse(message.id)}>
                    <ThumbUpIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => onErrorResponse(message.id)}>
                    <ThumbDownIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleSwitchModel()}>
                    <AutorenewIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </MessagePaper>
          </Box>
        ))}
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handlePopoverClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <IconButton onClick={() => { onQuoteReply(selectedText); handlePopoverClose(); }}>
          <FormatQuoteIcon /> 引用
        </IconButton>
      </Popover>
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        message="已复制到剪贴板"
      />
    </Box>
  );
};

export default ChatArea;