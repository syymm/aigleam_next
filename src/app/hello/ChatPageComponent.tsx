import React, { useState, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import TopNav from './components/TopNav/TopNav';
import Sidebar from './components/Sidebar/Sidebar';
import ChatArea from './components/ChatArea/ChatArea';
import InputArea from './components/InputArea/InputArea';
import { useTheme } from '../contexts/ThemeContext';
import styles from './styles/ChatPage.module.css';
import { useRouter } from 'next/navigation';
import { Message, Conversation, Prompt } from './types';

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
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'error' | 'warning' | 'info' | 'success';
  }>({
    open: false,
    message: '',
    severity: 'error'
  });
  const router = useRouter();

  useEffect(() => {
    loadConversations();
  }, []);

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
        // 直接开始新聊天，跳过欢迎屏幕
        handleStartNewChat();
      }
    } catch (error) {
      console.error('加载会话失败:', error);
      showError('加载会话列表失败');
      // 即使加载失败也开始新聊天
      handleStartNewChat();
    }
  };

  const handleDrawerOpen = () => setOpen(true);
  const handleDrawerClose = () => setOpen(false);

  // 显示错误信息的辅助函数
  const showError = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'error'
    });
  };

  // 显示成功信息的辅助函数
  const showSuccess = (message: string) => {
    setSnackbar({
      open: true,
      message,
      severity: 'success'
    });
  };

  // 关闭 Snackbar
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const handleStartNewChat = () => {
    const tempId = `temp-${Date.now()}`;
    setCurrentConversationId(tempId);
    setMessagesMap(prevMap => ({...prevMap, [tempId]: []}));
  };

  // 处理流式响应的函数
  const handleStreamResponse = async (
    response: Response, 
    messageId: string, 
    conversationId: string, 
    originalMessage: string, // 新增：原始消息，用于重试
    retryCount: number = 0
  ) => {
    try {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('无法获取响应流');
      }

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        setMessagesMap(prevMap => {
          const messages = prevMap[conversationId] || [];
          return {
            ...prevMap,
            [conversationId]: messages.map(msg =>
              msg.id === messageId 
                ? { ...msg, content: msg.content + text } 
                : msg
            )
          };
        });
      }
    } catch (error) {
      console.error('Stream error:', error);
      
      // 使用 Snackbar 显示错误
      showError('消息接收失败，正在重试...');
      
      // 更新消息状态为错误（但不改变内容）
      setMessagesMap(prevMap => {
        const messages = prevMap[conversationId] || [];
        return {
          ...prevMap,
          [conversationId]: messages.map(msg =>
            msg.id === messageId 
              ? { 
                  ...msg, 
                  content: msg.content || '加载中...', 
                  isError: true 
                } 
              : msg
          )
        };
      });

      // 重试逻辑（最多重试2次）
      if (retryCount < 2) {
        console.log(`重试第 ${retryCount + 1} 次...`);
        setTimeout(async () => {
          try {
            // 重新发送请求，使用原始消息
            const retryResponse = await fetch('/api/chat', {
              method: 'POST',
              body: createFormDataForRetry(conversationId, originalMessage),
            });

            if (retryResponse.ok) {
              // 清除错误状态
              setMessagesMap(prevMap => {
                const messages = prevMap[conversationId] || [];
                return {
                  ...prevMap,
                  [conversationId]: messages.map(msg =>
                    msg.id === messageId 
                      ? { ...msg, content: '', isError: false } 
                      : msg
                  )
                };
              });

              // 重新处理流
              await handleStreamResponse(retryResponse, messageId, conversationId, originalMessage, retryCount + 1);
            }
          } catch (retryError) {
            console.error('重试失败:', retryError);
            showError(`重试失败: ${retryError instanceof Error ? retryError.message : '未知错误'}`);
          }
        }, 1000 * Math.pow(2, retryCount)); // 指数退避
      } else {
        // 最终重试失败 - 保存错误消息到数据库而不是删除
        showError('AI回复失败，已保存为错误消息');
        
        // 将失败的消息标记为错误并保存到数据库
        try {
          await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              content: '[AI回复失败]',
              conversationId,
              isUser: false,
            }),
          });
        } catch (dbError) {
          console.error('保存错误消息失败:', dbError);
        }
        
        // 更新前端显示错误状态，但不删除消息
        setMessagesMap(prevMap => {
          const messages = prevMap[conversationId] || [];
          return {
            ...prevMap,
            [conversationId]: messages.map(msg =>
              msg.id === messageId 
                ? { ...msg, content: '[AI回复失败，请重新发送消息]', isError: true } 
                : msg
            )
          };
        });
      }
    }
  };

  // 创建重试用的FormData
  const createFormDataForRetry = (conversationId: string, originalMessage: string) => {
    const formData = new FormData();
    formData.append('message', originalMessage); // 使用原始消息而不是固定文本
    formData.append('model', selectedModel);
    formData.append('conversationId', conversationId);
    return formData;
  };

  const handleSendMessage = async (content: string, files: File[]) => {
    if (!currentConversationId || (!content.trim() && files.length === 0)) return;
    
    let actualConversationId = currentConversationId;
    
    try {

      // 如果是新会话，先创建会话
      if (currentConversationId.startsWith('temp-')) {
        const response = await fetch('/api/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: content.length > 20 ? `${content.slice(0, 20)}...` : content
          }),
        });

        if (!response.ok) throw new Error('创建会话失败');
        const newConversation = await response.json();
        actualConversationId = newConversation.id;
        setCurrentConversationId(actualConversationId);
        
        setConversations(prev => [{
          id: actualConversationId,
          title: content.length > 20 ? `${content.slice(0, 20)}...` : content,
          createdAt: new Date().toISOString()
        }, ...prev]);
      }

      // 准备 FormData
      const formData = new FormData();
      formData.append('message', content);
      formData.append('model', selectedModel);
      formData.append('conversationId', actualConversationId);
      
      // 添加文件
      files.forEach((file, index) => {
        formData.append(`file${index}`, file);
      });

      // 立即更新UI以显示用户消息
      const userMessage = {
        id: Date.now().toString(),
        content,
        isUser: true,
      };

      const fileMessages = files.map(file => ({
        id: `file-${Date.now()}-${file.name}`,
        content: `已上传文件：${file.name}`,
        isUser: true,
        fileName: file.name,
        fileType: file.type,
      }));

      setMessagesMap(prevMap => ({
        ...prevMap,
        [actualConversationId]: [
          ...(prevMap[actualConversationId] || []),
          userMessage,
          ...fileMessages
        ]
      }));

      setIsLoading(true);

      // 发送请求并处理流式响应
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        // 尝试解析错误响应
        let errorMessage = '发送消息失败';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // 如果无法解析JSON，使用默认错误消息
        }
        throw new Error(errorMessage);
      }

      // 添加AI消息占位符
      const aiMessage = {
        id: `ai-${Date.now()}`,
        content: '',
        isUser: false,
      };

      setMessagesMap(prevMap => ({
        ...prevMap,
        [actualConversationId]: [...(prevMap[actualConversationId] || []), aiMessage]
      }));

      // 处理流式响应（带错误处理和重试）
      await handleStreamResponse(response, aiMessage.id, actualConversationId, content);

    } catch (error) {
      console.error('Error:', error);
      
      // 使用 Snackbar 显示错误信息
      const errorMessage = error instanceof Error ? error.message : '发送消息失败，请检查网络连接或稍后重试';
      showError(errorMessage);
      
      // 检查错误类型，决定是否移除消息
      const shouldRemoveMessages = 
        actualConversationId.startsWith('temp-') || // 如果是临时对话创建失败
        (error instanceof Error && error.message.includes('创建会话失败')); // 或者会话创建失败
      
      if (shouldRemoveMessages) {
        // 只有在会话创建失败时才移除消息（因为还没保存到数据库）
        setMessagesMap(prevMap => {
          const messages = prevMap[actualConversationId] || [];
          const filteredMessages = messages.slice(0, -(1 + files.length));
          return {
            ...prevMap,
            [actualConversationId]: filteredMessages
          };
        });
      } else {
        // 如果是OpenAI API失败，用户消息已经保存到数据库，添加错误提示消息
        const errorMessageObj = {
          id: `error-${Date.now()}`,
          content: `[发送失败: ${errorMessage}]`,
          isUser: false,
          isError: true
        };
        
        setMessagesMap(prevMap => ({
          ...prevMap,
          [actualConversationId]: [...(prevMap[actualConversationId] || []), errorMessageObj]
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameConversation = async (conversationId: string, newTitle: string) => {
    if (conversationId.startsWith('temp-')) {
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.id === conversationId ? { ...conv, title: newTitle } : conv
        )
      );
      return;
    }
  
    try {
      const response = await fetch('/api/conversations/rename', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          title: newTitle
        }),
      });
  
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '重命名失败');
      }
  
      setConversations(prevConversations =>
        prevConversations.map(conv =>
          conv.id === conversationId ? { ...conv, title: newTitle } : conv
        )
      );
    } catch (error) {
      console.error('重命名失败:', error);
      const errorMessage = error instanceof Error ? error.message : '重命名失败';
      showError(errorMessage);
      throw error;
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
      const errorMessage = error instanceof Error ? error.message : '删除会话失败';
      showError(errorMessage);
      throw error;
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
      const errorMessage = error instanceof Error ? error.message : '切换会话失败';
      showError(errorMessage);
      throw error;
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
      handleSendMessage(`> ${content}\n\n`, []);
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
          <div className={styles.chatContainer}>
            <ChatArea
              messages={currentConversationId ? messagesMap[currentConversationId] || [] : []}
              onBestResponse={handleBestResponse}
              onErrorResponse={handleErrorResponse}
              onQuoteReply={handleQuoteReply}
              isLoading={isLoading}
            />
          </div>
          <div className={`${styles.inputContainer} ${styles[themeMode]}`}>
            <InputArea onSendMessage={handleSendMessage} />
          </div>
        </div>
      </Main>
      
      {/* 错误提示 Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ChatPageComponent;