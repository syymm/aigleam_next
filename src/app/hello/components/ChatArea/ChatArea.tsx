import React, { useState, useRef, useEffect } from 'react';
import { Box, Paper, Typography, Popover, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import IconButton from '@mui/material/IconButton';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';

interface Message {
 id: string;
 content: string;
 isUser: boolean;
 fileInfo?: {
   name: string;
   type: string;
   url?: string;
 };
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

 const renderMessage = (message: Message) => {
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
         <Typography 
           color="text.primary"
           sx={{
             wordBreak: 'break-word',
             overflowWrap: 'break-word',
             maxWidth: '100%',
           }}
         >
           {message.content}
         </Typography>
         {message.fileInfo && (
           <Box sx={{ mt: 1 }}>
             <Typography variant="caption" color="text.secondary">
               附件: {message.fileInfo.name}
             </Typography>
             {message.fileInfo.url && (
               <Box component="img" 
                 sx={{ 
                   mt: 1, 
                   maxWidth: '100%',
                   maxHeight: '200px',
                   borderRadius: 1 
                 }}
                 src={message.fileInfo.url}
                 alt={message.fileInfo.name}
               />
             )}
           </Box>
         )}
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
     }}
     onDragOver={(e) => e.preventDefault()}
     onDrop={(e) => e.preventDefault()}
   >
     <Box sx={{ width: '70%', maxWidth: '70%' }}>
       {messages.map(renderMessage)}
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