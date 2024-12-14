import React, { useState } from 'react';
import { styled, useTheme } from '@mui/material/styles';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemButton from '@mui/material/ListItemButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const drawerWidth = 240;

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

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
  onSwitchConversation: (conversationId: string) => void;
  onRenameConversation: (conversationId: string, newTitle: string) => void;
  onDeleteConversation: (conversationId: string) => void;
}

const RenameDialog: React.FC<{
  open: boolean;
  currentName: string;
  onClose: () => void;
  onRename: (newName: string) => void;
}> = ({ open, currentName, onClose, onRename }) => {
  const [newName, setNewName] = useState(currentName);

  const handleSubmit = () => {
    if (newName.trim()) {
      onRename(newName.trim());
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>重命名会话</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="会话名称"
          type="text"
          fullWidth
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSubmit();
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>取消</Button>
        <Button onClick={handleSubmit}>确认</Button>
      </DialogActions>
    </Dialog>
  );
};

const ConversationMenu: React.FC<{
  anchorEl: null | HTMLElement;
  open: boolean;
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
}> = ({ anchorEl, open, onClose, onRename, onDelete }) => (
  <Menu
    anchorEl={anchorEl}
    open={open}
    onClose={onClose}
    anchorOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
  >
    <MenuItem onClick={() => { onRename(); onClose(); }}>重命名</MenuItem>
    <MenuItem onClick={() => { onDelete(); onClose(); }}>删除</MenuItem>
  </Menu>
);

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
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, conversation: Conversation) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setSelectedConversation(conversation);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedConversation(null);
  };

  const handleRenameClick = () => {
    setRenameDialogOpen(true);
  };

  const handleRenameDialogClose = () => {
    setRenameDialogOpen(false);
    setSelectedConversation(null);
  };

  const handleRename = async (newTitle: string) => {
    if (selectedConversation) {
      setIsLoading(true);
      try {
        await onRenameConversation(selectedConversation.id, newTitle);
        handleRenameDialogClose();
      } catch (error) {
        setError('重命名会话失败');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async () => {
    if (selectedConversation) {
      setIsLoading(true);
      try {
        await onDeleteConversation(selectedConversation.id);
        handleMenuClose();
      } catch (error) {
        setError('删除会话失败');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSwitchConversation = async (conversationId: string) => {
    setIsLoading(true);
    try {
      await onSwitchConversation(conversationId);
    } catch (error) {
      setError('切换会话失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    setIsLoading(true);
    try {
      await handleStartNewChat();
    } catch (error) {
      setError('创建新会话失败');
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
      <DrawerHeader>
        <IconButton 
          onClick={handleNewChat} 
          sx={{ p: '12px' }}
          disabled={isLoading}
        >
          <AddIcon />
        </IconButton>
        <IconButton onClick={handleDrawerClose}>
          {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List sx={{ overflow: 'auto' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          conversations.map((conversation) => (
            <ListItem
              key={conversation.id}
              disablePadding
              secondaryAction={
                <IconButton
                  edge="end"
                  onClick={(e) => handleMenuClick(e, conversation)}
                  sx={{ visibility: currentConversationId === conversation.id ? 'visible' : 'hidden' }}
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
          ))
        )}
      </List>

      <ConversationMenu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        onRename={handleRenameClick}
        onDelete={handleDelete}
      />

      <RenameDialog
        open={renameDialogOpen}
        currentName={selectedConversation?.title || ''}
        onClose={handleRenameDialogClose}
        onRename={handleRename}
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