import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, Popover, CircularProgress, alpha } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import IconButton from '@mui/material/IconButton';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  // prompt?: {        // ← 原先用来显示 prompt 的字段，现在前端不再展示
  //   name: string;
  //   content: string;
  // };
}

interface ChatAreaProps {
  messages: Message[];
  onBestResponse: (messageId: string) => void;
  onErrorResponse: (messageId: string) => void;
  onQuoteReply: (content: string) => void;
  isLoading?: boolean;
}

const MessagePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  maxWidth: '70%',
  position: 'relative',
  backgroundColor:
    theme.palette.mode === 'dark'
      ? theme.palette.grey[900]
      : theme.palette.grey[100],
  wordWrap: 'break-word',
  overflowWrap: 'break-word',
  whiteSpace: 'pre-wrap',
  '& .message-actions': {
    visibility: 'hidden',
    position: 'absolute',
    right: theme.spacing(1),
    top: theme.spacing(1),
  },
  '&:hover .message-actions': {
    visibility: 'visible',
  },
}));

const FilePreview = styled(Box)(({ theme }) => ({
  marginTop: theme.spacing(1),
  padding: theme.spacing(1),
  borderRadius: theme.shape.borderRadius,
  backgroundColor:
    theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.grey[200],
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  onBestResponse,
  onErrorResponse,
  onQuoteReply,
  isLoading = false,
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

  const getFileIcon = (fileType?: string) => {
    if (!fileType)
      return <InsertDriveFileIcon sx={{ color: theme.palette.text.secondary }} />;

    if (fileType.startsWith('image/')) {
      return <ImageIcon sx={{ color: theme.palette.success.main }} />;
    } else if (fileType.includes('pdf')) {
      return <PictureAsPdfIcon sx={{ color: theme.palette.error.main }} />;
    } else if (
      fileType.includes('document') ||
      fileType.includes('text')
    ) {
      return <DescriptionIcon sx={{ color: theme.palette.primary.main }} />;
    }
    return <InsertDriveFileIcon sx={{ color: theme.palette.text.secondary }} />;
  };

  const renderMessage = (message: Message, index: number) => {
    // 检测是否是“文件消息”
    const isFileMessage = message.fileName && message.fileType;

    // 找出跟随在后面的、用户上传的文件消息（如果当前不是文件消息）
    const findRelatedFileMessages = () => {
      const fileMessages: Message[] = [];
      for (let i = index + 1; i < messages.length; i++) {
        const nextMsg = messages[i];
        if (!nextMsg || !nextMsg.isUser || !nextMsg.fileName) break;
        fileMessages.push(nextMsg);
      }
      return fileMessages;
    };

    const relatedFileMessages = !isFileMessage ? findRelatedFileMessages() : [];

    // 如果自己就是文件消息，并且前一条消息是用户消息，则合并显示
    const previousMessage = index > 0 ? messages[index - 1] : null;
    if (isFileMessage && previousMessage?.isUser) {
      return null; // 不单独渲染，将由上一个消息合并渲染文件
    }

    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          justifyContent: message.isUser ? 'flex-end' : 'flex-start',
          mb: 2,
        }}
      >
        <MessagePaper elevation={1} onMouseUp={handleTextSelection}>
          {/* 
            1) 去掉了以下代码，不再显示 prompt:

              {message.isUser && message.prompt && (
                <PromptChip> ... </PromptChip>
              )}

            2) 仅展示纯文本和文件 
          */}
          {message.content && !message.content.startsWith('已上传') && (
            <Typography
              color="text.primary"
              sx={{
                wordBreak: 'break-word',
                overflowWrap: 'break-word',
                maxWidth: '100%',
                mb: relatedFileMessages.length > 0 ? 1 : 0,
              }}
            >
              {message.content}
            </Typography>
          )}

          {/* 文件预览 */}
          {(isFileMessage || relatedFileMessages.length > 0) && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(isFileMessage ? [message] : relatedFileMessages).map(
                (fileMsg, fileIndex) => (
                  <FilePreview key={fileMsg.id}>
                    {fileMsg.fileType?.startsWith('image/') &&
                    fileMsg.fileUrl ? (
                      <Box
                        component="img"
                        src={fileMsg.fileUrl}
                        alt={fileMsg.fileName}
                        sx={{
                          maxWidth: '200px',
                          maxHeight: '200px',
                          borderRadius: 1,
                          objectFit: 'contain',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        {getFileIcon(fileMsg.fileType)}
                        <Typography>{fileMsg.fileName}</Typography>
                      </Box>
                    )}
                  </FilePreview>
                )
              )}
            </Box>
          )}

          {/* AI消息的操作按钮 */}
          {!message.isUser && (
            <Box className="message-actions">
              <IconButton
                size="small"
                onClick={() => onBestResponse(message.id)}
                sx={{ mr: 1 }}
              >
                <ThumbUpIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onErrorResponse(message.id)}
              >
                <ThumbDownIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </MessagePaper>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        flexGrow: 1,
        overflow: 'auto',
        p: 2,
        pt: (theme) =>
          `calc(${theme.spacing(2)} + ${theme.mixins.toolbar.minHeight}px)`,
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
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => e.preventDefault()}
    >
      <Box sx={{ width: '70%', maxWidth: '70%' }}>
        {messages.map((message, index) => renderMessage(message, index))}
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
        <IconButton
          onClick={() => {
            onQuoteReply(selectedText);
            handlePopoverClose();
          }}
        >
          <FormatQuoteIcon />
          <Typography variant="body2" sx={{ ml: 1 }}>
            引用
          </Typography>
        </IconButton>
      </Popover>
    </Box>
  );
};

export default ChatArea;
