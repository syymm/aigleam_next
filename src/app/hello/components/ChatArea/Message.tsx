// Message.tsx
import React from 'react';
import { Box, Paper, Typography, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import ImageIcon from '@mui/icons-material/Image';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DescriptionIcon from '@mui/icons-material/Description';

interface MessageProps {
  content: string;
  isUser: boolean;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  isImage?: boolean; // 新增：标记是否为AI生成图像
  imageUrl?: string; // 新增：AI生成图像的URL
  imagePrompt?: string; // 新增：生成图像的提示词
  onBestResponse?: () => void;
  onErrorResponse?: () => void;
  onTextSelect?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

const MessagePaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  maxWidth: '70%',
  position: 'relative',
  backgroundColor: theme.palette.mode === 'dark' 
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
  backgroundColor: theme.palette.mode === 'dark'
    ? theme.palette.grey[800]
    : theme.palette.grey[200],
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
}));

const Message: React.FC<MessageProps> = ({
  content,
  isUser,
  fileName,
  fileType,
  fileUrl,
  isImage,
  imageUrl,
  imagePrompt,
  onBestResponse,
  onErrorResponse,
  onTextSelect,
}) => {
  const getFileIcon = () => {
    if (!fileType) return <InsertDriveFileIcon />;
    
    if (fileType.startsWith('image/')) {
      return <ImageIcon sx={{ color: '#4CAF50' }} />;
    } else if (fileType.includes('pdf')) {
      return <DescriptionIcon sx={{ color: '#F44336' }} />;
    } else {
      return <InsertDriveFileIcon sx={{ color: '#2196F3' }} />;
    }
  };

  const isFileMessage = content.startsWith('已上传') || fileName;
  const showFilePreview = fileType?.startsWith('image/') && fileUrl;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        mb: 2,
      }}
    >
      <MessagePaper elevation={1} onMouseUp={onTextSelect}>
        {/* AI生成的图像 */}
        {isImage && imageUrl && (
          <Box>
            {imagePrompt && (
              <Typography 
                variant="body2" 
                color="text.secondary"
                sx={{ mb: 1, fontStyle: 'italic' }}
              >
                提示词: {imagePrompt}
              </Typography>
            )}
            <Box 
              component="img"
              src={imageUrl}
              alt={imagePrompt || '生成的图像'}
              sx={{
                maxWidth: '100%',
                maxHeight: '400px',
                borderRadius: 2,
                display: 'block',
                boxShadow: 2,
              }}
              onError={(e) => {
                console.error('图像加载失败:', imageUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
          </Box>
        )}
        
        {/* 普通文本消息 */}
        {!isFileMessage && !isImage && (
          <Typography 
            color="text.primary"
            sx={{
              wordBreak: 'break-word',
              overflowWrap: 'break-word',
              maxWidth: '100%',
            }}
          >
            {content}
          </Typography>
        )}
        
        {fileName && (
          <FilePreview>
            {showFilePreview ? (
              <Box 
                component="img"
                src={fileUrl}
                alt={fileName}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  borderRadius: 1,
                  display: 'block',
                }}
              />
            ) : (
              <>
                {getFileIcon()}
                <Typography variant="body2" sx={{ ml: 1 }}>
                  {fileName}
                </Typography>
              </>
            )}
          </FilePreview>
        )}

        {!isUser && !isFileMessage && (
          <Box className="message-actions">
            <IconButton 
              size="small" 
              onClick={onBestResponse}
              sx={{ mr: 1 }}
            >
              <ThumbUpIcon fontSize="small" />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={onErrorResponse}
            >
              <ThumbDownIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </MessagePaper>
    </Box>
  );
};

export default Message;