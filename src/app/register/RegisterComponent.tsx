'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TextField from '@mui/material/TextField';
import InputBase from '@mui/material/InputBase';
import SendIcon from '@mui/icons-material/Send';
import { Divider, Button, Snackbar, Alert } from '@mui/material';
import './RegisterComponent.css';

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

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setSnackbarMessage('密码不匹配');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      console.log('Sending registration request:', { username, verificationCode }); // 添加日志
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, verificationCode, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '注册失败');
      }

      setSnackbarMessage('注册成功！');
      setSnackbarSeverity('success');
      // 可以在这里添加注册成功后的逻辑，比如跳转到登录页面
    } catch (error) {
      console.error('注册时出错:', error);
      setSnackbarMessage(error instanceof Error ? error.message : '注册失败，请稍后再试');
      setSnackbarSeverity('error');
    } finally {
      setIsLoading(false);
      setSnackbarOpen(true);
    }
  };

  const handleSendVerificationCode = async () => {
    if (!username) {
      setSnackbarMessage('请输入邮箱地址');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
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

      if (!response.ok) {
        throw new Error('验证码发送失败');
      }

      setSnackbarMessage('验证码已发送，请检查您的邮箱');
      setSnackbarSeverity('success');
    } catch (error) {
      console.error('发送验证码时出错:', error);
      setSnackbarMessage('发送验证码失败，请稍后再试');
      setSnackbarSeverity('error');
    } finally {
      setSnackbarOpen(true);
      setIsCodeSending(false);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <div className="register-component">
      <div className="register-image">
        <Image src="/image/2.png" alt="RegisterImage" fill />
      </div>
      <div className="register-form">
        <h1 className="register-title">Register Now✍️</h1> 
        <form onSubmit={handleRegister}>
          <TextField
            sx={{ bgcolor: 'white', width: '100%'}}
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
                marginTop: '20px',
                height: '40px',
                width: '100%',
                border: '1px solid #d1d1d1',
                borderRadius: '4px',
                padding: '0 10px',
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
                      transform: 'translateY(-15px)',
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
            sx={{ bgcolor: 'white' }}
            type="password"
            label="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            variant="outlined"
            size="small"
          />
          <TextField
            sx={{ bgcolor: 'white', marginTop: '20px' }}
            type="password"
            label="确认密码"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            variant="outlined"
            size="small"
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
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default RegisterComponent;