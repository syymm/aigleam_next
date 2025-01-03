import React, { useState } from 'react';
import { 
  Avatar, 
  IconButton, 
  Menu, 
  Box,
  styled,
  MenuItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AvatarEditDialog from '../Dialogs/AvatarEditDialog';
import LogoutButton from '../Auth/LogoutButton';
import UpgradeButton from '../Account/UpgradeButton';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

interface UserAvatarProps {
  onThemeToggle: () => void;
  onUpgrade: () => void;
  isDarkMode: boolean;
}

const AvatarWrapper = styled(Box)(({ theme }) => ({
  position: 'relative',
  '&:hover .edit-button': {
    opacity: 1,
  },
}));

const EditButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  left: 0,
  bottom: 0,
  backgroundColor: theme.palette.background.paper,
  padding: '4px',
  opacity: 0,
  transition: 'opacity 0.2s',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
  '& .MuiSvgIcon-root': {
    fontSize: '0.8rem',
  },
}));

const UserAvatar: React.FC<UserAvatarProps> = ({ onThemeToggle, onUpgrade, isDarkMode }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleEditClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    setIsEditDialogOpen(true);
  };

  const handleAvatarSave = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/update-avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data.avatarUrl);
        
        // 立即创建并使用临时URL显示新头像
        const tempUrl = URL.createObjectURL(file);
        setAvatarUrl(tempUrl);
        
        // 清理临时URL
        return () => URL.revokeObjectURL(tempUrl);
      }
    } catch (error) {
      console.error('更新头像失败:', error);
    }
  };

  return (
    <>
      <AvatarWrapper>
        <IconButton onClick={handleClick}>
          <Avatar src={avatarUrl || undefined} />
        </IconButton>
        <EditButton 
          className="edit-button"
          onClick={handleEditClick}
        >
          <EditIcon />
        </EditButton>
      </AvatarWrapper>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <UpgradeButton onUpgrade={onUpgrade} />
        <MenuItem onClick={onThemeToggle}>
          <ListItemIcon>
            {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
          </ListItemIcon>
          <ListItemText primary={isDarkMode ? "浅色模式" : "深色模式"} />
        </MenuItem>
        <LogoutButton onClose={handleClose} />
      </Menu>

      <AvatarEditDialog
        open={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleAvatarSave}
      />
    </>
  );
};

export default UserAvatar;