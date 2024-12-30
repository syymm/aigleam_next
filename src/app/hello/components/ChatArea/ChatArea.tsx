import React, { useState, useRef, useEffect } from 'react';
import { Box, Typography, Popover, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import IconButton from '@mui/material/IconButton';
import Message from './Message';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
}

interface ChatAreaProps {
  messages: Message[];
  onBestResponse: (messageId: string) => void;
  onErrorResponse: (messageId: string) => void;
  onQuoteReply: (content: string) => void;
  isLoading?: boolean;
}

const ChatArea: React.FC<ChatAreaProps> = ({ 
  messages,
  onBestResponse,
  onErrorResponse,
  onQuoteReply,
  isLoading = false
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedText, setSelectedText] = useState('');
  const theme = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const renderFileMessages = (mainMessage: Message, index: number) => {
    const fileMessages: Message[] = [];
    
    // 从主消息后收集连续的文件消息
    for (let i = index + 1; i < messages.length; i++) {
      const msg = messages[i];
      if (!msg.isUser || !msg.fileName) break;
      fileMessages.push(msg);
    }

    return (
      <Box key={mainMessage.id}>
        <Message
          content={mainMessage.content}
          isUser={mainMessage.isUser}
          onTextSelect={handleTextSelection}
          onBestResponse={() => onBestResponse(mainMessage.id)}
          onErrorResponse={() => onErrorResponse(mainMessage.id)}
        />
        {fileMessages.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              justifyContent: 'flex-end',
              mb: 2,
            }}
          >
            {fileMessages.map(fileMsg => (
              <Box
                key={fileMsg.id}
                sx={{
                  maxWidth: fileMsg.fileType?.startsWith('image/') ? '200px' : '300px',
                }}
              >
                <Message
                  content={fileMsg.content}
                  isUser={true}
                  fileName={fileMsg.fileName}
                  fileType={fileMsg.fileType}
                  fileUrl={fileMsg.fileUrl}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
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
      '&::-webkit-scrollbar': {
        width: '16px',
      },
      '&::-webkit-scrollbar-track': {
        backgroundColor: 'var(--scrollbar-track)',
      },
      '&::-webkit-scrollbar-thumb': {
        backgroundColor: 'var(--scrollbar-thumb)',
        borderRadius: '4px',
      },
      '&::-webkit-scrollbar-thumb:hover': {
        backgroundColor: 'var(--scrollbar-thumb-hover)',
      },
    }}>
      <Box sx={{ width: '70%', maxWidth: '70%' }}>
        {messages.map((message, index) => {
          // 如果这是一个文件消息且不是第一条消息，跳过（因为它会在主消息中被渲染）
          if (message.fileName && index > 0 && messages[index - 1].isUser) {
            return null;
          }
          return renderFileMessages(message, index);
        })}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        <div ref={messagesEndRef} />
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
        <IconButton onClick={() => { 
          onQuoteReply(selectedText); 
          handlePopoverClose(); 
        }}>
          <FormatQuoteIcon />
          <Typography variant="body2" sx={{ ml: 1 }}>引用</Typography>
        </IconButton>
      </Popover>
    </Box>
  );
};

export default ChatArea;