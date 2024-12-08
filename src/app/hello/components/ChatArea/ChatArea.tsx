import React, { useState } from 'react';
import { Box, Paper, Typography, Popover, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import IconButton from '@mui/material/IconButton';

interface Message {
 id: string;
 content: string;
 isUser: boolean;
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
       {messages.map((message) => (
         <Box
           key={message.id}
           sx={{
             display: 'flex',
             justifyContent: message.isUser ? 'flex-end' : 'flex-start',
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
           </MessagePaper>
         </Box>
       ))}
       {isLoading && (
         <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
           <CircularProgress size={24} />
         </Box>
       )}
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
   </Box>
 );
};

export default ChatArea;