'use client';

import React from 'react';
import { 
  Container, 
  Typography, 
  Box
} from '@mui/material';
import ChangePasswordForm from '@/components/ChangePasswordForm';

export default function SettingsPage() {
  const handlePasswordChangeSuccess = () => {
    console.log('密码修改成功');
  };

  const handlePasswordChangeError = (error: string) => {
    console.error('密码修改失败:', error);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2
    }}>
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" fontWeight="bold" color="white" gutterBottom>
            修改密码
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            为了您的账户安全，请设置一个强密码
          </Typography>
        </Box>
        
        <ChangePasswordForm 
          onSuccess={handlePasswordChangeSuccess}
          onError={handlePasswordChangeError}
        />
      </Container>
    </Box>
  );
}