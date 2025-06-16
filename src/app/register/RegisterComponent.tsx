'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TextField from '@mui/material/TextField';
import InputBase from '@mui/material/InputBase';
import SendIcon from '@mui/icons-material/Send';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { Divider, Button, Snackbar, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import './RegisterComponent.css';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error';
}

const RegisterComponent: React.FC = () => {
  const [username, setUsername] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeSending, setIsCodeSending] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleClickShowPassword = () => {
    setShowPassword((show) => !show);
  };

  const showNotification = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 表单验证
    if (!username.trim()) {
      showNotification('请输入邮箱地址', 'error');
      return;
    }

    if (!verificationCode.trim()) {
      showNotification('请输入验证码', 'error');
      return;
    }

    if (!password.trim()) {
      showNotification('请输入密码', 'error');
      return;
    }

    if (password.length < 6) {
      showNotification('密码长度不能少于6位', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showNotification('两次输入的密码不一致', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, verificationCode, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      // 注册成功，直接跳转到登录页
      router.push('/login');
    } catch (error) {
      console.error('注册时出错:', error);
      let errorMessage = '注册失败，请稍后再试';
      
      if (error instanceof Error) {
        // 匹配后端可能返回的错误信息
        switch (error.message) {
          case 'All fields are required':
            errorMessage = '请填写所有必填项';
            break;
          case 'Invalid or expired verification code':
            errorMessage = '验证码无效或已过期';
            break;
          case 'User already exists':
            errorMessage = '该邮箱已被注册';
            break;
          case 'Error registering user':
            errorMessage = '注册失败，请稍后重试';
            break;
          default:
            errorMessage = error.message || '注册失败，请稍后再试';
        }
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationCode = async () => {
    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!username || !emailRegex.test(username)) {
      showNotification('请输入有效的邮箱地址', 'error');
      return;
    }
    
    setIsCodeSending(true);
    try {
      const response = await fetch('/api/send-verification-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      showNotification(data.message || '验证码已发送，请检查您的邮箱', 'success');
    } catch (error) {
      console.error('发送验证码时出错:', error);
      let errorMessage = '发送验证码失败，请稍后再试';
      
      if (error instanceof Error) {
        errorMessage = error.message || '发送验证码失败，请稍后再试';
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setIsCodeSending(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <div className="register-component">
      <div className="register-image">
        <Image src="/image/30.png" alt="RegisterImage" fill />
      </div>
      <div className="register-form">
        <h1 className="register-title">Register Now✍️</h1> 
        <form onSubmit={handleRegister}>
          <TextField
            sx={{ 
              bgcolor: 'white', 
              width: '100%', 
              marginTop: '10px', 
              borderRadius: '4px',
              '& .MuiInputBase-input': {
                color: '#000000',
              }
            }}
            label="Email"
            type="email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            variant="outlined"
            size="small"
          />
          <div className="verification-code-section">
            <InputBase
              sx={{
                bgcolor: 'white',
                marginTop: '15px',
                height: '40px',
                width: '100%',
                border: '1px solid #d1d1d1',
                borderRadius: '4px',
                padding: '0 10px',
                '& .MuiInputBase-input': {
                  color: '#000000',
                }
              }}
              placeholder="验证码"
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              required
              endAdornment={
                <>
                  <Divider sx={{ height: 28, m: 0.5 }} orientation="vertical" />
                  <Button
                    id="customButton"
                    variant="text"
                    size="small"
                    endIcon={<SendIcon sx={{ color: '#6200ea', transform: 'translateY(-1px)' }} />}
                    sx={{
                      height: '30px !important',
                      ml: 1,
                      transform: 'translateY(-12px)',
                      color: '#6200ea',
                      backgroundColor: 'transparent',
                      boxShadow: 'none',
                      '&:hover': {
                        backgroundColor: 'transparent',
                        boxShadow: 'none',
                      },
                    }}
                    onClick={handleSendVerificationCode}
                    disabled={isCodeSending || !username}
                  >
                    {isCodeSending ? '发送中...' : '发送'}
                  </Button>
                </>
              }
            />
          </div>
          <TextField
            sx={{ 
              bgcolor: 'white', 
              marginTop: '-5px', 
              borderRadius: '4px',
              '& .MuiInputBase-input': {
                color: '#000000',
              }
            }}
            type={showPassword ? 'text' : 'password'}
            label="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            variant="outlined"
            size="small"
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    edge="end"
                    style={{ backgroundColor: 'transparent', padding: 0, margin: 'auto 0', top: '50%', transform: 'translateY(-50%)', color: '#666' }}
                  >
                    {showPassword ? <VisibilityOff style={{ fontSize: 24 }} /> : <Visibility style={{ fontSize: 24 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            sx={{ 
              bgcolor: 'white', 
              marginTop: '10px', 
              borderRadius: '4px',
              '& .MuiInputBase-input': {
                color: '#000000',
              }
            }}
            type={showPassword ? 'text' : 'password'}
            label="确认密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            variant="outlined"
            size="small"
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    edge="end"
                    style={{ backgroundColor: 'transparent', padding: 0, margin: 'auto 0', top: '50%', transform: 'translateY(-50%)', color: '#666' }}
                  >
                    {showPassword ? <VisibilityOff style={{ fontSize: 24 }} /> : <Visibility style={{ fontSize: 24 }} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>
        <p>
          已有账号？<Link href="/login">现在登录</Link>
        </p>
      </div>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default RegisterComponent;