import React from 'react';
import { MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { ExitToApp } from '@mui/icons-material';

interface LogoutButtonProps {
  onLogout: () => void;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({ onLogout }) => {
  return (
    <MenuItem onClick={onLogout}>
      <ListItemIcon>
        <ExitToApp />
      </ListItemIcon>
      <ListItemText primary="注销" />
    </MenuItem>
  );
};

export default LogoutButton;
