import React, { useState } from 'react';
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
import { Conversation, Message } from './types';

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

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleStartNewChat = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: `新对话 ${conversations.length + 1}`
    };
    setConversations([...conversations, newConversation]);
    setCurrentConversationId(newConversation.id);
    setMessagesMap(prevMap => ({...prevMap, [newConversation.id]: []}));
  };

  const handleSendMessage = async (content: string) => {
    if (!currentConversationId || !content.trim()) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      isUser: true
    };
    
    setMessagesMap(prevMap => ({
      ...prevMap,
      [currentConversationId]: [...(prevMap[currentConversationId] || []), userMessage]
    }));
  
    setIsLoading(true);
  
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: content,
          model: selectedModel
        }),
      });
  
      if (!response.ok) {
        throw new Error('发送消息失败');
      }
  
      const data = await response.json();
  
      const aiMessage: Message = {
        id: data.messageId,
        content: data.reply,
        isUser: false,
      };
  
      setMessagesMap(prevMap => ({
        ...prevMap,
        [currentConversationId]: [...(prevMap[currentConversationId] || []), aiMessage]
      }));
  
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBestResponse = (messageId: string) => {
    console.log('Best response:', messageId);
  };

  const handleErrorResponse = (messageId: string) => {
    console.log('Error response:', messageId);
  };

  const handleQuoteReply = (content: string) => {
    console.log('Quote reply:', content);
  };

  const handleUpgrade = () => {
    console.log('Upgrade clicked');
  };

  const handleLogout = () => {
    console.log('Logout clicked');
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
        onLogout={handleLogout}
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