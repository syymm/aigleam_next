'use client';

import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  IconButton, 
  InputAdornment,
  Alert,
  Snackbar,
  Paper,
  Fade,
  LinearProgress,
  Chip
} from '@mui/material';
import { 
  Visibility, 
  VisibilityOff, 
  Lock, 
  Security,
  CheckCircle,
  Error as ErrorIcon
} from '@mui/icons-material';

interface ChangePasswordFormProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

// 密码强度检查函数
const getPasswordStrength = (password: string) => {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    symbols: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  score = Object.values(checks).filter(Boolean).length;
  
  const levels = [
    { label: '太弱', color: '#f44336', progress: 20 },
    { label: '弱', color: '#ff9800', progress: 40 },
    { label: '中等', color: '#ffc107', progress: 60 },
    { label: '强', color: '#4caf50', progress: 80 },
    { label: '很强', color: '#2e7d32', progress: 100 }
  ];
  
  return { 
    score, 
    level: levels[Math.min(score, 4)], 
    checks 
  };
};

export default function ChangePasswordForm({ onSuccess, onError }: ChangePasswordFormProps) {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{
    show: boolean;
    type: 'success' | 'error';
    message: string;
  }>({
    show: false,
    type: 'success',
    message: ''
  });

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const handleInputChange = (field: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      showAlert('error', '请填写所有字段');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showAlert('error', '两次输入的新密码不一致');
      return;
    }

    if (formData.newPassword.length < 6) {
      showAlert('error', '新密码至少需要6位');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showAlert('success', '密码修改成功');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        onSuccess?.();
      } else {
        showAlert('error', data.error || '密码修改失败');
        onError?.(data.error || '密码修改失败');
      }
    } catch (error) {
      showAlert('error', '网络错误，请稍后重试');
      onError?.('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({
      show: true,
      type,
      message
    });
  };

  const handleCloseAlert = () => {
    setAlert(prev => ({
      ...prev,
      show: false
    }));
  };

  return (
    <Paper 
      elevation={8} 
      sx={{ 
        p: 4, 
        borderRadius: 3,
        background: 'white',
        maxWidth: 500,
        mx: 'auto'
      }}
    >
        <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 当前密码 */}
          <Box>
            <TextField
              fullWidth
              label="当前密码"
              type={showPasswords.current ? 'text' : 'password'}
              value={formData.currentPassword}
              onChange={handleInputChange('currentPassword')}
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'white',
                  '& input': {
                    color: '#333333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: '#666666',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#667eea',
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('current')}
                      edge="end"
                      sx={{ color: '#667eea' }}
                    >
                      {showPasswords.current ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {/* 新密码 */}
          <Box>
            <TextField
              fullWidth
              label="新密码"
              type={showPasswords.new ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={handleInputChange('newPassword')}
              required
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'white',
                  '& input': {
                    color: '#333333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: '#666666',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#667eea',
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Security sx={{ color: '#667eea' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('new')}
                      edge="end"
                      sx={{ color: '#667eea' }}
                    >
                      {showPasswords.new ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            {/* 密码强度指示器 */}
            {formData.newPassword && (
              <Fade in={true}>
                <Box sx={{ mt: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      密码强度:
                    </Typography>
                    <Chip 
                      label={passwordStrength.level?.label || ''}
                      size="small"
                      sx={{ 
                        backgroundColor: passwordStrength.level?.color || 'grey',
                        color: 'white',
                        fontWeight: 'bold'
                      }}
                    />
                  </Box>
                  
                  <LinearProgress
                    variant="determinate"
                    value={passwordStrength.level?.progress || 0}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: passwordStrength.level?.color || 'grey',
                        borderRadius: 4,
                      }
                    }}
                  />
                  
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    {Object.entries(passwordStrength.checks).map(([key, passed]) => (
                      <Chip
                        key={key}
                        size="small"
                        icon={passed ? <CheckCircle /> : <ErrorIcon />}
                        label={
                          key === 'length' ? '至少8位' :
                          key === 'lowercase' ? '小写字母' :
                          key === 'uppercase' ? '大写字母' :
                          key === 'numbers' ? '数字' :
                          key === 'symbols' ? '特殊字符' : key
                        }
                        color={passed ? 'success' : 'default'}
                        variant={passed ? 'filled' : 'outlined'}
                      />
                    ))}
                  </Box>
                </Box>
              </Fade>
            )}
          </Box>

          {/* 确认密码 */}
          <Box>
            <TextField
              fullWidth
              label="确认新密码"
              type={showPasswords.confirm ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              required
              error={formData.confirmPassword !== '' && formData.newPassword !== formData.confirmPassword}
              variant="outlined"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  backgroundColor: 'white',
                  '& input': {
                    color: '#333333',
                  },
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: '#666666',
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#667eea',
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    {formData.confirmPassword && formData.newPassword === formData.confirmPassword ? (
                      <CheckCircle sx={{ color: '#4caf50' }} />
                    ) : (
                      <Lock sx={{ color: '#667eea' }} />
                    )}
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => togglePasswordVisibility('confirm')}
                      edge="end"
                      sx={{ color: '#667eea' }}
                    >
                      {showPasswords.confirm ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText={
                formData.confirmPassword !== '' && formData.newPassword !== formData.confirmPassword
                  ? '两次输入的密码不一致'
                  : formData.confirmPassword && formData.newPassword === formData.confirmPassword
                  ? '密码匹配 ✓'
                  : ''
              }
            />
          </Box>

          {/* 提交按钮 */}
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            size="large"
            fullWidth
            sx={{ 
              mt: 2,
              py: 2,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              textTransform: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                boxShadow: '0 12px 40px rgba(102, 126, 234, 0.4)',
                transform: 'translateY(-2px)',
              },
              '&:disabled': {
                background: 'linear-gradient(135deg, #cccccc 0%, #999999 100%)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <LinearProgress sx={{ width: 20, height: 3 }} />
                修改中...
              </Box>
            ) : (
              '修改密码'
            )}
          </Button>
        </Box>

        {/* 提示信息 */}
        <Snackbar
          open={alert.show}
          autoHideDuration={6000}
          onClose={handleCloseAlert}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert
            onClose={handleCloseAlert}
            severity={alert.type}
            variant="filled"
            sx={{ 
              width: '100%',
              borderRadius: 2,
              '& .MuiAlert-icon': {
                fontSize: '1.5rem'
              }
            }}
          >
            {alert.message}
          </Alert>
        </Snackbar>
    </Paper>
  );
}