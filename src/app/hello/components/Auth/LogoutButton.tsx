import React from 'react';
import { MenuItem, ListItemIcon, ListItemText, Snackbar, Alert } from '@mui/material';
import { ExitToApp } from '@mui/icons-material';

const LogoutButton: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [error, setError] = React.useState<string | null>(null);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('登出失败，请稍后重试');
      }

      if (onClose) {
        onClose();
      }
      
      // 登出成功直接跳转，无需显示提示
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // 显示错误提示
      setError(error instanceof Error ? error.message : '登出时发生错误');
    }
  };

  return (
    <>
      <MenuItem onClick={handleLogout}>
        <ListItemIcon>
          <ExitToApp />
        </ListItemIcon>
        <ListItemText primary="注销" />
      </MenuItem>

      {/* 错误提示 Snackbar */}
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000}
        onClose={() => setError(null)}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error" 
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
};

export default LogoutButton;