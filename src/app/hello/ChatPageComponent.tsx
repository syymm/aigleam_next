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

interface Conversation {
  id: string;
  title: string;
  messages?: Message[];
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
          setConversations(data);
          if (data.length > 0) {
            setCurrentConversationId(data[0].id);
            const messagesResponse = await fetch(`/api/conversations/${data[0].id}`);
            if (messagesResponse.ok) {
              const messageData = await messagesResponse.json();
              setMessagesMap(prevMap => ({
                ...prevMap,
                [data[0].id]: messageData.messages
              }));
            }
          } else {
            handleStartNewChat(); // 如果没有会话，创建一个临时会话
          }
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
    // 创建临时会话
    const tempId = `temp-${Date.now()}`;
    const tempConversation: Conversation = {
      id: tempId,
      title: `新会话 ${conversations.length + 1}`
    };
    setConversations([...conversations, tempConversation]);
    setCurrentConversationId(tempId);
    setMessagesMap(prevMap => ({...prevMap, [tempId]: []}));
  };

  const handleSendMessage = async (content: string, file?: File) => {
    if (!currentConversationId || !content.trim()) return;
    
    setIsLoading(true);

    try {
      let actualConversationId = currentConversationId;

      // 如果是临时会话，先创建实际会话
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

        // 更新状态
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === currentConversationId ? newConversation : conv
          )
        );
        setCurrentConversationId(actualConversationId);

        // 转移临时消息
        const tempMessages = messagesMap[currentConversationId] || [];
        setMessagesMap(prevMap => {
          const newMap = { ...prevMap };
          delete newMap[currentConversationId];
          newMap[actualConversationId] = tempMessages;
          return newMap;
        });
      }

      const formData = new FormData();
      formData.append('message', content);
      formData.append('model', selectedModel);
      formData.append('conversationId', actualConversationId);
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

      setMessagesMap(prevMap => {
        const userMessage: Message = {
          id: data.userMessageId,
          content,
          isUser: true,
          ...(file && {
            fileInfo: {
              name: file.name,
              type: file.type,
            }
          })
        };

        const aiMessage: Message = {
          id: data.messageId,
          content: data.reply,
          isUser: false
        };

        return {
          ...prevMap,
          [actualConversationId]: [
            ...(prevMap[actualConversationId] || []),
            userMessage,
            aiMessage
          ]
        };
      });
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    // 不处理临时会话的重命名
    if (conversationId.startsWith('temp-')) {
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.id === conversationId ? { ...conv, title: newTitle } : conv
        )
      );
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
    // 如果是临时会话，直接从状态中删除
    if (conversationId.startsWith('temp-')) {
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
          setCurrentConversationId(null);
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
    // 如果是临时会话，直接切换
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