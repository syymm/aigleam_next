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
import { useRouter } from 'next/navigation';
import { Message, Conversation } from './types';

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
  const router = useRouter();

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await fetch('/api/conversations');
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        if (response.ok) {
          const data = await response.json();
          const sortedData = data.sort((a: Conversation, b: Conversation) => {
            return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
          });
          setConversations(sortedData);
          handleStartNewChat();
        }
      } catch (error) {
        console.error('加载会话失败:', error);
      }
    };

    loadConversations();
  }, [router]);

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  const handleStartNewChat = () => {
    const tempId = `temp-${Date.now()}`;
    setCurrentConversationId(tempId);
    setMessagesMap(prevMap => ({...prevMap, [tempId]: []}));
  };

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!currentConversationId || (!content.trim() && (!files || files.length === 0))) return;
    
    try {
      let actualConversationId = currentConversationId;

      if (currentConversationId.startsWith('temp-')) {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: content.length > 20 ? `${content.slice(0, 20)}...` : content
          }),
        });

        if (!response.ok) {
          throw new Error('创建会话失败');
        }

        const newConversation = await response.json();
        actualConversationId = newConversation.id;
        setCurrentConversationId(actualConversationId);

        setConversations(prevConversations => [
          {
            id: actualConversationId,
            title: content.length > 20 ? `${content.slice(0, 20)}...` : content,
            createdAt: new Date().toISOString()
          },
          ...prevConversations
        ]);
      }

      // 立即显示用户消息
      const userMessage: Message = {
        id: Date.now().toString(),
        content,
        isUser: true,
      };

      // 如果有文件，为每个文件创建临时消息对象
      const fileMessages = files?.map(file => ({
        id: `file-${Date.now()}-${file.name}`,
        content: `已上传文件：${file.name}`,
        isUser: true,
        fileName: file.name,
        fileType: file.type
      })) || [];

      // 更新消息列表，包含主消息和文件消息
      setMessagesMap(prevMap => ({
        ...prevMap,
        [actualConversationId]: [
          ...(prevMap[actualConversationId] || []),
          userMessage,
          ...fileMessages
        ]
      }));

      setIsLoading(true);

      const formData = new FormData();
      formData.append('message', content);
      formData.append('model', selectedModel);
      formData.append('conversationId', actualConversationId);
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          formData.append(`file${index}`, file);
        });
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('发送消息失败');
      }

      // 创建 AI 消息占位
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        content: '',
        isUser: false,
      };

      setMessagesMap(prevMap => ({
        ...prevMap,
        [actualConversationId]: [...(prevMap[actualConversationId] || []), aiMessage]
      }));

      // 处理流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        
        // 更新 AI 消息内容
        setMessagesMap(prevMap => {
          const messages = prevMap[actualConversationId] || [];
          const updatedMessages = messages.map(msg =>
            msg.id === aiMessage.id 
              ? { ...msg, content: msg.content + text } 
              : msg
          );
          return {
            ...prevMap,
            [actualConversationId]: updatedMessages
          };
        });
      }

    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    if (conversationId.startsWith('temp-')) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        setConversations(prevConversations =>
          prevConversations.map(conv =>
            conv.id === conversationId ? { ...conv, title: newTitle } : conv
          )
        );
      }
    } catch (error) {
      console.error('重命名会话失败:', error);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (conversationId.startsWith('temp-')) {
      if (currentConversationId === conversationId) {
        handleStartNewChat();
      }
      setMessagesMap(prevMap => {
        const newMap = { ...prevMap };
        delete newMap[conversationId];
        return newMap;
      });
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConversations(prevConversations =>
          prevConversations.filter(conv => conv.id !== conversationId)
        );
        if (currentConversationId === conversationId) {
          handleStartNewChat();
        }
        setMessagesMap(prevMap => {
          const newMap = { ...prevMap };
          delete newMap[conversationId];
          return newMap;
        });
      }
    } catch (error) {
      console.error('删除会话失败:', error);
    }
  };

  const handleSwitchConversation = async (conversationId: string) => {
    if (conversationId.startsWith('temp-')) {
      setCurrentConversationId(conversationId);
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessagesMap(prevMap => ({
          ...prevMap,
          [conversationId]: data.messages
        }));
        setCurrentConversationId(conversationId);
      }
    } catch (error) {
      console.error('切换会话失败:', error);
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