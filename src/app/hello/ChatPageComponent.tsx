import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import TopNav from './components/TopNav/TopNav';
import Sidebar from './components/Sidebar/Sidebar';
import ChatArea from './components/ChatArea/ChatArea';
import InputArea from './components/InputArea/InputArea';
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen';
import { useTheme } from '../contexts/ThemeContext';
import styles from './styles/ChatPage.module.css';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  fileInfo?: {
    name: string;
    type: string;
  };
}

interface Conversation {
  id: string;
  title: string;
}

const drawerWidth = 240;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  paddingTop: theme.mixins.toolbar.minHeight,
  backgroundColor: theme.palette.background.default,
}));

const ChatPageComponent: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { themeMode, toggleTheme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [messagesMap, setMessagesMap] = useState<Record<string, Message[]>>({});
  const [selectedModel, setSelectedModel] = useState('gpt-3.5-turbo');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedConversations = localStorage.getItem('conversations');
    const savedMessagesMap = localStorage.getItem('messagesMap');
    
    if (savedConversations) {
      setConversations(JSON.parse(savedConversations));
    }
    if (savedMessagesMap) {
      setMessagesMap(JSON.parse(savedMessagesMap));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('conversations', JSON.stringify(conversations));
    localStorage.setItem('messagesMap', JSON.stringify(messagesMap));
  }, [conversations, messagesMap]);

  const updateConversationTitle = (conversationId: string, messages: Message[]) => {
    if (messages.length >= 2) {
      const firstUserMessage = messages.find(m => m.isUser);
      if (firstUserMessage) {
        const newTitle = firstUserMessage.content.length > 20 
          ? `${firstUserMessage.content.slice(0, 20)}...`
          : firstUserMessage.content;
        
        setConversations(prevConversations =>
          prevConversations.map(conv =>
            conv.id === conversationId ? { ...conv, title: newTitle } : conv
          )
        );
      }
    }
  };

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const handleStartNewChat = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: `新会话 ${conversations.length + 1}`
    };
    setConversations([...conversations, newConversation]);
    setCurrentConversationId(newConversation.id);
    setMessagesMap(prevMap => ({...prevMap, [newConversation.id]: []}));
  };

  const handleSendMessage = async (content: string, file?: File) => {
    if (!currentConversationId || !content.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true,
      ...(file && {
        fileInfo: {
          name: file.name,
          type: file.type,
        }
      })
    };
    
    setMessagesMap(prevMap => {
      const updatedMessages = [...(prevMap[currentConversationId] || []), userMessage];
      return {
        ...prevMap,
        [currentConversationId]: updatedMessages
      };
    });

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', content);
      formData.append('model', selectedModel);
      formData.append('conversationId', currentConversationId);
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('发送消息失败');
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: data.messageId,
        content: data.reply,
        isUser: false
      };

      setMessagesMap(prevMap => {
        const updatedMessages = [...(prevMap[currentConversationId] || []), aiMessage];
        setTimeout(() => updateConversationTitle(currentConversationId, updatedMessages), 0);
        return {
          ...prevMap,
          [currentConversationId]: updatedMessages
        };
      });

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBestResponse = (messageId: string) => {
    console.log('标记为最佳回复:', messageId);
  };

  const handleErrorResponse = (messageId: string) => {
    console.log('标记为错误回复:', messageId);
  };

  const handleQuoteReply = (content: string) => {
    if (currentConversationId) {
      handleSendMessage(`> ${content}\n\n`);
    }
  };

  const handleUpgrade = () => {
    console.log('升级账户');
  };

  const handleSwitchConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    if (!messagesMap[conversationId]) {
      setMessagesMap(prevMap => ({...prevMap, [conversationId]: []}));
    }
  };

  const handleRenameConversation = (conversationId: string, newTitle: string) => {
    setConversations(prevConversations =>
      prevConversations.map(conv =>
        conv.id === conversationId ? { ...conv, title: newTitle } : conv
      )
    );
  };

  const handleDeleteConversation = (conversationId: string) => {
    setConversations(prevConversations =>
      prevConversations.filter(conv => conv.id !== conversationId)
    );
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
    }
    setMessagesMap(prevMap => {
      const newMap = { ...prevMap };
      delete newMap[conversationId];
      return newMap;
    });
  };

  useEffect(() => {
    if (conversations.length === 0) {
      handleStartNewChat();
    }
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <CssBaseline />
      <TopNav 
        open={open} 
        handleDrawerOpen={handleDrawerOpen}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        onThemeToggle={toggleTheme}
        onUpgrade={handleUpgrade}
        isDarkMode={themeMode === 'dark'}
      />
      <Sidebar 
        open={open} 
        handleDrawerClose={handleDrawerClose} 
        handleStartNewChat={handleStartNewChat} 
        conversations={conversations}
        currentConversationId={currentConversationId}
        onSwitchConversation={handleSwitchConversation}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <Main open={open}>
        <div className={`${styles.mainContent} ${styles[themeMode]}`}>
          {currentConversationId ? (
            <>
              <ChatArea
                messages={messagesMap[currentConversationId] || []}
                onBestResponse={handleBestResponse}
                onErrorResponse={handleErrorResponse}
                onQuoteReply={handleQuoteReply}
                isLoading={isLoading}
              />
              <InputArea onSendMessage={handleSendMessage} />
            </>
          ) : (
            <WelcomeScreen onStartNewChat={handleStartNewChat} />
          )}
        </div>
      </Main>
    </Box>
  );
};

export default ChatPageComponent;