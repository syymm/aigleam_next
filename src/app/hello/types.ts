// Prompt 接口
export interface Prompt {
  id?: string;
  name: string;
  content: string;
  userId?: number;
  createdAt?: string;
  updatedAt?: string;
}

// 消息接口
export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  fileName?: string;
  fileType?: string;
  fileUrl?: string;
  isError?: boolean; // 前端用于标识加载状态，不存储到数据库
  isImage?: boolean; // 标记是否为AI生成图像
  imageUrl?: string; // AI生成图像的URL
  imagePrompt?: string; // 生成图像的提示词
}

// 对话接口
export interface Conversation {
  id: string;
  title: string;
  createdAt?: string;
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
  onSendMessage: (content: string, files?: File[]) => void;
}

// WelcomeScreen组件的Props接口
export interface WelcomeScreenProps {
  onStartNewChat: () => void;
}
