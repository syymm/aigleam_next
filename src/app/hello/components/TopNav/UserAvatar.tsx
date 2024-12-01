import React, { useState } from 'react';
import { Avatar, Menu, MenuItem, Divider, IconButton, useTheme } from '@mui/material';
import { Brightness4, Brightness7 } from '@mui/icons-material';
import LogoutButton from '../Auth/LogoutButton';

interface UserAvatarProps {
  onThemeToggle: () => void;
  onUpgrade: () => void;
  isDarkMode: boolean;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ 
  onThemeToggle, 
  onUpgrade,
  isDarkMode 
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const theme = useTheme();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <IconButton onClick={handleClick} size="small">
        <Avatar />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            backgroundColor: theme.palette.background.paper,
            color: theme.palette.text.primary,
          },
        }}
      >
        <MenuItem onClick={() => { onThemeToggle(); handleClose(); }}>
          {isDarkMode ? <Brightness7 /> : <Brightness4 />}
          <span style={{ marginLeft: '12px' }}>{isDarkMode ? '浅色主题' : '深色主题'}</span>
        </MenuItem>
        <Divider />
        <LogoutButton onClose={handleClose} />
      </Menu>
    </div>
  );
};

export default UserAvatar;