export interface Conversation {
    id: string;
    title: string;
  }
  
  export interface Message {
    id: string;
    content: string;
    isUser: boolean;
  }