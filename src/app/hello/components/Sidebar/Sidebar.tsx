import React, { useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SidebarHeader from './SidebarHeader';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import { Conversation } from '../../types';
import ChatMenu from '../Menus/ChatMenu';
import RenameDialog from '../Dialogs/RenameDialog';

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

interface SidebarProps {
  open: boolean;
  handleDrawerClose: () => void;
  handleStartNewChat: () => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSwitchConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, newTitle: string) => void;
  onDeleteConversation: (conversationId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  open, 
  handleDrawerClose, 
  handleStartNewChat, 
  conversations, 
  currentConversationId,
  onSwitchConversation,
  onRenameConversation,
  onDeleteConversation
}) => {
  const theme = useTheme();
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const handleNewChat = () => {
    handleStartNewChat();
  };

  const handleRenameClick = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setRenameDialogOpen(true);
  };

  const handleRenameClose = () => {
    setRenameDialogOpen(false);
    setSelectedConversation(null);
  };

  const handleRename = (newTitle: string) => {
    if (selectedConversation) {
      onRenameConversation(selectedConversation.id, newTitle);
    }
    handleRenameClose();
  };

  return (
    <Drawer
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: 'none',
          backgroundColor: theme.palette.background.paper,
        },
      }}
      variant="persistent"
      anchor="left"
      open={open}
    >
      <DrawerHeader>
        <SidebarHeader onNewConversation={handleNewChat} />
        <IconButton 
          onClick={handleDrawerClose}
          sx={{
            padding: '20px',
            width: '40px',    // 设置固定宽度
            height: '40px',   // 设置固定高度 
            '& .MuiSvgIcon-root': {
              fontSize: '2rem',
            }
          }}
        >
          {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List>
        {conversations.map((conversation) => (
          <ListItem 
            button 
            key={conversation.id}
            selected={conversation.id === currentConversationId}
            onClick={() => onSwitchConversation(conversation.id)}
          >
            <ListItemText primary={conversation.title} />
            <ChatMenu
              onRenameClick={() => handleRenameClick(conversation)}
              onDelete={() => onDeleteConversation(conversation.id)}
            />
          </ListItem>
        ))}
      </List>
      <RenameDialog
        isOpen={renameDialogOpen}
        onClose={handleRenameClose}
        onRename={handleRename}
        currentName={selectedConversation?.title || ''}
      />
    </Drawer>
  );
};

export default Sidebar;