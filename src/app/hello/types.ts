// src/app/hello/types.ts  (或者您的项目中types.ts的实际位置)

// 消息接口
export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  fileInfo?: {
    name: string;
    type: string;
    url?: string;
  };
}

// 对话接口
export interface Conversation {
  id: string;
  title: string;
}

// TopNav组件的Props接口
export interface TopNavProps {
  open: boolean;
  handleDrawerOpen: () => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  onThemeToggle: () => void;
  onUpgrade: () => void;
  isDarkMode: boolean;
}

// Sidebar组件的Props接口
export interface SidebarProps {
  open: boolean;
  handleDrawerClose: () => void;
  handleStartNewChat: () => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSwitchConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onDeleteConversation: (id: string) => void;
}

// ChatArea组件的Props接口
export interface ChatAreaProps {
  messages: Message[];
  onBestResponse: (messageId: string) => void;
  onErrorResponse: (messageId: string) => void;
  onQuoteReply: (content: string) => void;
  isLoading: boolean;
}

// InputArea组件的Props接口
export interface InputAreaProps {
  onSendMessage: (content: string, file?: File) => void;
}

// WelcomeScreen组件的Props接口
export interface WelcomeScreenProps {
  onStartNewChat: () => void;
}