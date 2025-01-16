import React, { useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import {
  Drawer,
  List,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Menu,
  MenuItem
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RenameDialog from '../Dialogs/RenameDialog';
import SidebarHeader from './SidebarHeader';

const drawerWidth = 240;

interface Conversation {
  id: string;
  title: string;
}

interface SidebarProps {
  open: boolean;
  handleDrawerClose: () => void;
  handleStartNewChat: () => void;
  conversations: Conversation[];
  currentConversationId: string | null;
  onSwitchConversation: (conversationId: string) => Promise<void>;
  onRenameConversation: (conversationId: string, newTitle: string) => Promise<void>;
  onDeleteConversation: (conversationId: string) => Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({
  open,
  handleDrawerClose,
  handleStartNewChat,
  conversations,
  currentConversationId,
  onSwitchConversation,
  onRenameConversation,
  onDeleteConversation,
}) => {
  const theme = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, conversation: Conversation) => {
    console.log('Menu clicked for conversation:', conversation);
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedConversation(conversation);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    // Don't clear selectedConversation here
  };

  const handleRenameClick = () => {
    console.log('Rename button clicked, selected conversation:', selectedConversation);
    setIsRenameDialogOpen(true);
    handleMenuClose();
  };

  const handleRename = async (newTitle: string) => {
    console.log('handleRename called with title:', newTitle);
    if (!selectedConversation) {
      console.log('No conversation selected');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Calling onRenameConversation with:', {
        id: selectedConversation.id,
        newTitle
      });
      await onRenameConversation(selectedConversation.id, newTitle);
      setIsRenameDialogOpen(false);
      setSelectedConversation(null);
    } catch (error) {
      console.error('Rename error:', error);
      setError('重命名失败');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameDialogClose = () => {
    setIsRenameDialogOpen(false);
    setSelectedConversation(null);
  };

  const handleDelete = async () => {
    if (!selectedConversation) return;
    
    setIsLoading(true);
    try {
      console.log('Deleting conversation:', selectedConversation.id);
      await onDeleteConversation(selectedConversation.id);
      handleMenuClose();
    } catch (error) {
      console.error('Delete error:', error);
      setError('删除会话失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchConversation = async (conversationId: string) => {
    setIsLoading(true);
    try {
      await onSwitchConversation(conversationId);
    } catch (error) {
      console.error('Switch conversation error:', error);
      setError('切换会话失败');
    } finally {
      setIsLoading(false);
    }
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
      <SidebarHeader 
        onNewConversation={handleStartNewChat}
        onDrawerClose={handleDrawerClose}
        isLoading={isLoading}
      />
      
      <Divider />

      <List sx={{ overflow: 'auto' }}>
        {conversations.map((conversation) => (
          <ListItem
            key={conversation.id}
            disablePadding
            secondaryAction={
              <IconButton
                edge="end"
                onClick={(e) => handleMenuClick(e, conversation)}
                sx={{ 
                  visibility: currentConversationId === conversation.id ? 'visible' : 'hidden',
                  '&:hover': { visibility: 'visible' }
                }}
              >
                <MoreVertIcon />
              </IconButton>
            }
            sx={{
              '&:hover .MuiIconButton-root': {
                visibility: 'visible',
              },
            }}
          >
            <ListItemButton
              selected={conversation.id === currentConversationId}
              onClick={() => handleSwitchConversation(conversation.id)}
              disabled={isLoading}
              sx={{
                py: 2,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.action.selected,
                },
              }}
            >
              <ListItemText
                primary={conversation.title}
                primaryTypographyProps={{
                  noWrap: true,
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleRenameClick}>重命名</MenuItem>
        <MenuItem onClick={() => {
          handleDelete();
          handleMenuClose();
        }}>删除</MenuItem>
      </Menu>

      <RenameDialog
        isOpen={isRenameDialogOpen}
        onClose={handleRenameDialogClose}
        onRename={handleRename}
        currentName={selectedConversation?.title || ''}
      />

      <Snackbar
        open={!!error}
        autoHideDuration={3000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setError(null)}
          severity="error"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Drawer>
  );
};

export default Sidebar;